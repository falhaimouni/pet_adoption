import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  CHAT_ALLOWED_ROLES,
  CHAT_SENDER_ROLES,
} from '@shared/constants/chat.constants';
import { SendMessageDto } from '@shared/dto/message.dto';
import { ConversationStatusEnum } from '@shared/enums/conversation-status.enum';
import { MessageType } from '@shared/enums/message-type.enum';
import { Conversation, Message, User } from '../../../database/entities';
import { DataSource, EntityManager, Repository } from 'typeorm';

type ChatRole = (typeof CHAT_ALLOWED_ROLES)[number];

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
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

    return this.dataSource.transaction(async (manager) => {
      const conversationRepo = manager.getRepository(Conversation);
      const messageRepo = manager.getRepository(Message);
      const conversation = await conversationRepo.findOne({
        where: { conversationId },
        relations: { adopter: true },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
      if (conversation.status === ConversationStatusEnum.CLOSED) {
        throw new ForbiddenException(
          'Cannot send message to a closed conversation',
        );
      }

      if (chatRole === 'ADOPTER') {
        if (conversation.adopter.userId !== userId) {
          throw new ForbiddenException(
            'Cannot send message to a conversation you are not part of',
          );
        }
      } else if (chatRole === 'EMPLOYEE') {
        await this.claimConversation(
          conversation,
          conversationId,
          userId,
          manager,
        );
      }

      const message = messageRepo.create({
        senderId: userId,
        conversationId,
        messageText:
          dto.type === MessageType.TEXT ? dto.messageText : dto.caption ?? null,
        fileUrl: dto.type === MessageType.TEXT ? null : dto.fileUrl,
        type: dto.type,
      });
      return messageRepo.save(message);
    });
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
    await this.getAuthorizedConversation(conversationId, userId, chatRole);

    const update = this.messageRepo
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('is_read = false');

    if (chatRole === 'ADOPTER') {
      update.andWhere('sender_id != :userId', { userId });
    }
    await update.execute();
  }

  private async claimConversation(
    conversation: Conversation,
    conversationId: string,
    userId: string,
    manager: EntityManager,
  ): Promise<void> {
    if (
      conversation.assignedEmployeeId &&
      conversation.assignedEmployeeId !== userId
    ) {
      throw new ForbiddenException(
        'Cannot send message to a conversation you are not assigned to',
      );
    }
    if (conversation.assignedEmployeeId) return;

    const result = await manager
      .createQueryBuilder()
      .update(Conversation)
      .set({
        assignedEmployeeId: userId,
        status: ConversationStatusEnum.ASSIGNED,
      })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('assigned_employee_id IS NULL')
      .andWhere('status = :status', { status: ConversationStatusEnum.OPEN })
      .execute();

    if (result.affected === 0) {
      throw new ForbiddenException(
        'Cannot send message to a conversation you are not assigned to',
      );
    }
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
