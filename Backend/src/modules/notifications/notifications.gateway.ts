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
import { DataSource, Repository } from 'typeorm';

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
  pingInterval: 5000,
  pingTimeout: 5000,
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
    private readonly db: DataSource,
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

    const wasOnline = this.isOnline(user.userId);
    const sockets = this.socketsByUser.get(user.userId) ?? new Set<string>();
    sockets.add(client.id);
    this.socketsByUser.set(user.userId, sockets);
    if (!wasOnline) void this.broadcastPresence(user.userId);
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
      void this.broadcastPresence(userId);
    }
  }

  isOnline(userId: string): boolean {
    return Boolean(this.socketsByUser.get(userId)?.size);
  }

  emitToUsers(userIds: string[], event: string, payload: unknown): void {
    if (!userIds.length) return;
    this.server?.to(userIds.map((id) => this.userRoom(id))).emit(event, payload);
  }

  private async broadcastPresence(userId: string): Promise<void> {
    try {
      const friends: { userId: string }[] = await this.db.query(
        'SELECT CASE WHEN user1_id=$1 THEN user2_id ELSE user1_id END AS "userId" FROM friendships WHERE user1_id=$1 OR user2_id=$1',
        [userId],
      );
      this.emitToUsers(friends.map((friend) => friend.userId), SOCKET_EVENTS.FRIEND_PRESENCE, {
        userId, online: this.isOnline(userId),
      });
    } catch {
      // Presence is transient; the next friends refresh reconciles a missed event.
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
      user.emailVerified === false ||
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
