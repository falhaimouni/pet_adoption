import { ChatPresenceService } from './chat-presence.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  CHAT_ALLOWED_ROLES,
  CHAT_SENDER_ROLES,
} from '@shared/constants/chat.constants';
import { SendMessageDto } from '@shared/dto/message.dto';
import { MessageType } from '@shared/enums/message-type.enum';
import { Conversation, Message, User } from '../../../database/entities';
import { DataSource, Repository } from 'typeorm';

type ChatRole = (typeof CHAT_ALLOWED_ROLES)[number];

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    private readonly notifications: NotificationsService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly presence: ChatPresenceService,
  ) {}

  async sendMessage(
    conversationId: string,
    userId: string,
    role: string,
    dto: SendMessageDto,
  ): Promise<Message> {
    const chatRole = this.ensureChatRole(role);
    if (!(CHAT_SENDER_ROLES as readonly string[]).includes(chatRole)) {
      throw new ForbiddenException('Your role has read-only chat access');
    }

    const persist = () => this.dataSource.transaction(async (manager) => {
      const conversationRepo = manager.getRepository(Conversation);
      const messageRepo = manager.getRepository(Message);
      const conversation = await conversationRepo.findOne({
        where: { conversationId },
        relations: { adopter: true },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
      if (chatRole === 'ADOPTER') {
        if (conversation.adopter.userId !== userId) {
          throw new ForbiddenException(
            'Cannot send message to a conversation you are not part of',
          );
        }
      }

      const message = messageRepo.create({
        senderId: userId,
        conversationId,
        messageText:
          dto.type === MessageType.TEXT ? dto.messageText : dto.caption ?? null,
        fileUrl: dto.type === MessageType.TEXT ? null : dto.fileUrl,
        type: dto.type,
      });
      const saved = await messageRepo.save(message);
      await conversationRepo.update(conversationId, { updatedAt: saved.createdAt });
      const sender = await manager.getRepository(User).findOne({ where: { userId }, select: { userId: true, firstName: true, lastName: true } });
      if (sender) saved.sender = sender;
      return saved;
    });
    const saved = chatRole === 'EMPLOYEE'
      ? await this.presence.reply(conversationId, userId, persist)
      : await persist();
    try {
      const conversation = await this.getAuthorizedConversation(conversationId, userId, chatRole);
      await this.notifications.createChatMessage(userId, conversation.adopter.userId, chatRole === 'ADOPTER');
    } catch (error) {
      this.logger.error('Unable to deliver chat notification', error instanceof Error ? error.stack : undefined);
    }
    return saved;
  }

  async getMessages(
    conversationId: string,
    userId: string,
    role: string,
  ): Promise<Message[]> {
    const chatRole = this.ensureChatRole(role);
    await this.getAuthorizedConversation(conversationId, userId, chatRole);

    const messages = await this.messageRepo.find({
      where: { conversationId },
      relations: { sender: true },
      order: { createdAt: 'ASC' },
    });
    return messages.map((message) => {
      if (message.sender) this.removeSensitiveFields(message.sender);
      return message;
    });
  }

  async markMessagesAsRead(
    conversationId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    const chatRole = this.ensureChatRole(role);
    const conversation = await this.getAuthorizedConversation(conversationId, userId, chatRole);

    const update = this.messageRepo
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('is_read = false');

    if (chatRole === 'ADOPTER') {
      update.andWhere('sender_id != :userId', { userId });
    } else {
      update.andWhere('sender_id = :adopterUserId', { adopterUserId: conversation.adopter.userId });
    }
    await update.execute();
  }

  private async getAuthorizedConversation(
    conversationId: string,
    userId: string,
    role: ChatRole,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepo.findOne({
      where: { conversationId },
      relations: { adopter: true },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (role === 'ADOPTER' && conversation.adopter.userId !== userId) {
      throw new ForbiddenException(
        'Cannot access a conversation you are not part of',
      );
    }
    return conversation;
  }

  private ensureChatRole(role: string): ChatRole {
    if (!(CHAT_ALLOWED_ROLES as readonly string[]).includes(role)) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }
    return role as ChatRole;
  }

  private removeSensitiveFields(user: User): void {
    delete (user as Partial<User>).password;
    delete (user as Partial<User>).refreshTokenVersion;
  }
}
