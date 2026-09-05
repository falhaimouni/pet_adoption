import {
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { SOCKET_EVENTS } from '@shared/events';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';

import { User } from '../../database/entities';
import { NotificationResponse } from './notifications.service';

type AccessTokenPayload = {
  sub: string;
  email: string;
  role: string;
  tokenVersion: number;
  typ?: 'access' | 'refresh';
};

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server!: Server;

  private readonly socketsByUser = new Map<string, Set<string>>();

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  afterInit(server: Server): void {
    server.use(async (client, next) => {
      try {
        client.data.user = await this.authenticate(client);
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });
  }

  handleConnection(client: Socket): void {
    const user = client.data.user;

    if (!user) {
      client.disconnect(true);
      return;
    }

    client.join(this.userRoom(user.userId));

    const sockets = this.socketsByUser.get(user.userId) ?? new Set<string>();
    sockets.add(client.id);
    this.socketsByUser.set(user.userId, sockets);
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data.user?.userId;

    if (!userId) {
      return;
    }

    const sockets = this.socketsByUser.get(userId);
    sockets?.delete(client.id);

    if (sockets?.size === 0) {
      this.socketsByUser.delete(userId);
    }
  }

  sendToUser(userId: string, notification: NotificationResponse): void {
    this.server
      .to(this.userRoom(userId))
      .emit(SOCKET_EVENTS.NEW_NOTIFICATION, notification);
  }

  private async authenticate(client: Socket) {
    const token = this.extractToken(client);

    if (!token) {
      throw new Error('Missing token');
    }

    const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
      token,
      {
        secret: this.configService.get<string>('JWT_SECRET'),
      },
    );

    if (payload.typ === 'refresh') {
      throw new Error('Invalid token type');
    }

    const user = await this.userRepo.findOne({
      where: { userId: payload.sub },
      relations: ['role'],
    });

    if (
      !user ||
      user.status !== 'active' ||
      !user.role ||
      user.role.isActive === false ||
      payload.tokenVersion !== user.refreshTokenVersion
    ) {
      throw new Error('Invalid user');
    }

    return {
      userId: user.userId,
      email: user.email,
      role: user.role.roleName,
    };
  }

  private extractToken(client: Socket): string | undefined {
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === 'string') {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    const authorization = client.handshake.headers.authorization;

    if (typeof authorization === 'string') {
      return authorization.replace(/^Bearer\s+/i, '');
    }

    return undefined;
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }
}
