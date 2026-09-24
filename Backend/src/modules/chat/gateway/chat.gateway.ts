import { ChatPresenceService } from '../services/chat-presence.service';
import {
        ConnectedSocket,
        MessageBody,
        SubscribeMessage,
        WebSocketGateway,
        WebSocketServer,
} from "@nestjs/websockets";
import { UseGuards } from '@nestjs/common';

import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";
import { MessageService } from "../services/message.service";
import { ConversationService } from "../services/conversation.service";
import { SendMessageDto } from "@shared/dto/message.dto";
import { WsJwtGuard } from "../guards/ws-jwt.guard";
import { SOCKET_EVENTS } from '@shared/events';
import { validateOrReject } from 'class-validator';
import { Message } from '../../../database/entities';

@WebSocketGateway({
        pingInterval: 5000,
        pingTimeout: 5000,
        cors:{
                origin: '*',
        },
})
@UseGuards(WsJwtGuard)

export class ChatGateway
{
        @WebSocketServer()
        server!: Server;

        constructor(
                private readonly messageService: MessageService,
                private readonly conversationService: ConversationService,
                private readonly jwtService: JwtService,
                private readonly presence: ChatPresenceService,
        ) {}

        afterInit() {
                this.presence.changes.on('change', (state) => {
                        this.server.to(`conversation:${state.conversationId}`).emit('conversationOwnership', state);
                        this.server.to('staff-inbox').emit('chatInboxChanged');
                });
        }

        async handleConnection(socket: Socket)
        {
                try{
                        const token = this.extractToken(socket);
                        if (!token)
                        {
                                socket.disconnect();
                                return;
                        }
                        const payload = await this.jwtService.verifyAsync(token);
                        socket.data.user = {
                                userId: payload.sub,
                                email: payload.email,
                                role: payload.role,
                        };
                        if (['EMPLOYEE', 'ADMIN', 'MANAGER'].includes(payload.role)) await socket.join('staff-inbox');
                        console.log(
                                `User ${socket.data.user.userId} connected`,
                        );
                } catch {
                        socket.disconnect();
                }
        }

        handleDisconnect(socket: Socket)
        {
                this.presence.disconnect(socket.id);
                console.log(
                        `User ${socket.data.user?.userId} disconnected`,
                );
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

        broadcastMessage(conversationId: string, message: Message) {
                this.server
                        .to(`conversation:${conversationId}`)
                        .emit(SOCKET_EVENTS.RECEIVE_MESSAGE, message);
        }

        @SubscribeMessage(SOCKET_EVENTS.JOIN_CONVERSATION)
        async handleJoinConversation(
                @MessageBody() conversationId: string,
                @ConnectedSocket() client: Socket
        ) {
                const user = client.data.user;
                if (!user) {
                        client.emit('error', 'Unauthorized');
                        return {
                                event: 'joinedConversationError',
                                message: 'Unauthorized',
                        };
                }
                try{
                        await this.conversationService.getConversation(
                                conversationId,
                                user.userId,
                                user.role,
                        );
                        await client.join(`conversation:${conversationId}`);
                        if (['EMPLOYEE', 'ADMIN', 'MANAGER'].includes(user.role)) this.presence.join(conversationId, user.userId, client.id);
                        client.emit('conversationOwnership', { conversationId, assignedEmployeeId: this.presence.owner(conversationId) });
                        return {
                                event: 'joinedConversation',
                                conversationId,
                                userId: user.userId,
                        };
                } catch (error)
                {
                        return {
                                event: 'joinedConversationError',
                                message: error instanceof Error ? error.message : 'Unable to join conversation',
                        };
                }
        }

        @SubscribeMessage(SOCKET_EVENTS.SEND_MESSAGE)
        async handleSendMessage(
                @MessageBody() data: { conversationId: string; dto: SendMessageDto },
                @ConnectedSocket() client: Socket
        ) {
                const user = client.data.user;
                if (!user) {
                        client.emit('error', 'Unauthorized');
                        return;
                }

                try{
                        await validateOrReject(
                                Object.assign(new SendMessageDto(), data?.dto),
                                { whitelist: true, forbidNonWhitelisted: true },
                        );
                        const message = await this.messageService.sendMessage(
                                data.conversationId,
                                user.userId,
                                user.role,
                                data.dto,
                        );
                        this.broadcastMessage(data.conversationId, message);
                        return{
                                event: 'messageSent',
                                message,
                        };
                } catch (error)
                {
                        return {
                                event: 'messageSentError',
                                message: error instanceof Error ? error.message : 'Unable to send message',
                        };
                }
        }

        @SubscribeMessage(SOCKET_EVENTS.LEAVE_CONVERSATION)
        async handleLeaveConversation(
                @MessageBody() conversationId: string,
                @ConnectedSocket() client: Socket
        ) {
                const user = client.data.user;
                if (!user) {
                        client.emit('error', 'Unauthorized');
                        return {
                                event: 'leftConversationError',
                                message: 'Unauthorized',
                        };
                }
                this.presence.leave(conversationId, user.userId, client.id);
                await client.leave(`conversation:${conversationId}`);
                return {
                        event: 'leftConversation',
                        conversationId,
                };
        }

        @SubscribeMessage(SOCKET_EVENTS.MARK_MESSAGES_READ)
        async handleMarkMessageAsRead(
                @MessageBody() conversationId: string,
                @ConnectedSocket() client: Socket
        ) {
                const user = client.data.user;
                if (!user) {
                        client.emit('error', 'Unauthorized');
                        return;
                }
                try{
                        await this.messageService.markMessagesAsRead(conversationId, user.userId, user.role);
                        return {
                                event: 'messagesMarkedAsRead',
                                conversationId,
                        };
                }
                catch (error)
                {
                        return {
                                event: 'messagesMarkedAsReadError',
                                message: error instanceof Error ? error.message : 'Unable to mark messages as read',
                        };
                }
        }

}
