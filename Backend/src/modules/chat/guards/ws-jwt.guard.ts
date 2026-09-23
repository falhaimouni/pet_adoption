import {
        CanActivate,
        ExecutionContext,
        Injectable,
        UnauthorizedException,
} from "@nestjs/common";
import {JwtService} from '@nestjs/jwt'
import {Socket} from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
        constructor(private readonly jwtService: JwtService) {}

        async canActivate(context: ExecutionContext): Promise<boolean>
        {
                const client = context.switchToWs().getClient<Socket>();
                const token = this.extractToken(client);
                if (!token) {
                        throw new UnauthorizedException('No token provided');
                }

                try {
                        const payload = await this.jwtService.verifyAsync<{ sub: string; email: string; role: string }>(token);
                        client.data.user =
                        {
                                userId: payload.sub,
                                email: payload.email,
                                role: payload.role,
                        };
                        return true;
                } catch (err) {
                        throw new UnauthorizedException('Invalid or expired token');
                }
        }

        private extractToken(client: Socket): string | null
        {
                const authHeader = client.handshake.headers.authorization;
                if (authHeader?.startsWith('Bearer ')) {
                        return authHeader.substring(7);
                }
                const token = client.handshake.auth?.token;
                if (token) {
                        return token;
                }
                return null;
        }
}
