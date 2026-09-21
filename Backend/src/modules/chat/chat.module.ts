import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import {
        Adopter,
        Conversation,
        Message,
} from '../../database/entities';
import { ConversationService } from './services/conversation.service';
import { MessageController } from './controller/message.controller';
import { MessageService } from './services/message.service';
import { ConversationController } from './controller/conversation.controller';
import { ChatGateway } from './gateway/chat.gateway';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@Module({
        imports: [
                TypeOrmModule.forFeature([Conversation, Message, Adopter]),
                ConfigModule,
                JwtModule.registerAsync({
                        inject: [ConfigService],
                        useFactory: (configService: ConfigService) => ({
                                secret: configService.get<string>('JWT_SECRET'),
                        }),
                }),
        ],
        controllers: [MessageController, ConversationController],
        providers: [MessageService, ConversationService, ChatGateway, WsJwtGuard],
        exports: [ChatGateway],
})

export class ChatModule {}