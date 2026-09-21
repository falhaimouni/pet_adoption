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

@WebSocketGateway({
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
        ) {}

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
                        console.log(
                                `User ${socket.data.user.userId} connected`,
                        );
                } catch {
                        socket.disconnect();
                }
        }

        handleDisconnect(socket: Socket)
        {
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

        @SubscribeMessage('joinConversation')
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
                        client.join(`conversation:${conversationId}`);
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

        @SubscribeMessage('sendMessage')
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
                        const message = await this.messageService.sendMessage(
                                data.conversationId,
                                user.userId,
                                user.role,
                                data.dto,
                        );
                        this.server.to(`conversation:${data.conversationId}`).emit('newMessage', message);
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

        @SubscribeMessage('leaveConversation')
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
                client.leave(`conversation:${conversationId}`);
                return {
                        event: 'leftConversation',
                        conversationId,
                };
        }

        @SubscribeMessage('markMessagesAsRead')
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