import { ChatPresenceService } from './chat-presence.service';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CHAT_ALLOWED_ROLES } from '@shared/constants/chat.constants';
import { ConversationStatusEnum } from '@shared/enums';
import { Adopter, Conversation, Message, User } from '../../../database/entities';
import { QueryFailedError, Repository } from 'typeorm';

type ChatRole = (typeof CHAT_ALLOWED_ROLES)[number];

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Adopter)
    private readonly adopterRepo: Repository<Adopter>,
    private readonly presence: ChatPresenceService,
  ) {}

  async createConversation(userId: string): Promise<Conversation> {
    const adopter = await this.adopterRepo.findOne({ where: { userId } });
    if (!adopter) {
      throw new NotFoundException('Adopter not found');
    }

    const existingConversation = await this.conversationRepo.findOne({
      where: {
        adopterId: adopter.adopterId,
      },
      order: { updatedAt: 'DESC' },
    });
    if (existingConversation) {
      return this.removeSensitiveUserFields(existingConversation);
    }

    try {
      return await this.conversationRepo.save(
        this.conversationRepo.create({
          adopterId: adopter.adopterId,
          status: ConversationStatusEnum.OPEN,
          assignedEmployeeId: null,
        }),
      );
    } catch (error) {
      if (error instanceof QueryFailedError && (error as any).code === '23505') {
        const concurrentConversation = await this.conversationRepo.findOne({
          where: {
            adopterId: adopter.adopterId,
          },
        });
        if (concurrentConversation) return this.removeSensitiveUserFields(concurrentConversation);
      }
      throw error;
    }
  }

  async getMyConversations(userId: string): Promise<Conversation[]> {
    const adopter = await this.adopterRepo.findOne({ where: { userId } });
    if (!adopter) {
      throw new NotFoundException('Adopter not found');
    }

    const conversations = await this.conversationRepo.find({
      where: { adopterId: adopter.adopterId },
      relations: { adopter: true },
      order: { updatedAt: 'DESC' },
    });
    return this.withSummaries(conversations, true);
  }

  async getEmployeeConversations(): Promise<Conversation[]> {
    const conversations = await this.conversationRepo.find({
      relations: { adopter: { user: true }, assignedEmployee: true },
      order: { updatedAt: 'DESC' },
    });
    return this.withSummaries(conversations, false);
  }

  async getConversation(
    conversationId: string,
    userId: string,
    role: string,
  ): Promise<Conversation> {
    const chatRole = this.ensureChatRole(role);
    const conversation = await this.conversationRepo.findOne({
      where: { conversationId },
      relations: {
        adopter: { user: true },
        assignedEmployee: true,
        messages: { sender: true },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (
      chatRole === 'ADOPTER' &&
      conversation.adopter.userId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }

    conversation.messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return this.removeSensitiveUserFields(conversation);
  }

  async releaseConversation(conversationId: string, _staffUserId: string): Promise<Conversation> {
    return this.getConversation(conversationId, _staffUserId, 'EMPLOYEE');
  }

  async updateStatus(_conversationId: string, _employeeId: string, _status?: 'OPEN' | 'CLOSED'): Promise<Conversation> {
    throw new ConflictException('Shared support conversations cannot be closed or assigned');
  }

  private async withSummaries(conversations: Conversation[], adopterView: boolean): Promise<Conversation[]> {
    const messageRepo = this.conversationRepo.manager.getRepository(Message);
    const summaries = await Promise.all(conversations.map(async (conversation) => {
      const [lastMessage, unreadCount] = await Promise.all([
        messageRepo.findOne({ where: { conversationId: conversation.conversationId }, order: { createdAt: 'DESC' } }),
        messageRepo.createQueryBuilder('message')
          .where('message.conversationId = :id', { id: conversation.conversationId })
          .andWhere('message.isRead = false')
          .andWhere(`message.senderId ${adopterView ? '!=' : '='} :adopterUserId`, { adopterUserId: conversation.adopter.userId })
          .getCount(),
      ]);
      return Object.assign(this.removeSensitiveUserFields(conversation), {
        ...(!adopterView ? { isInProgress: Boolean(this.presence.owner(conversation.conversationId)) } : {}),
        lastMessage, unreadCount, updatedAt: lastMessage?.createdAt ?? conversation.createdAt,
      });
    }));
    return summaries.filter(c => adopterView || c.lastMessage).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  private ensureChatRole(role: string): ChatRole {
    if (!(CHAT_ALLOWED_ROLES as readonly string[]).includes(role)) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }
    return role as ChatRole;
  }

  private removeSensitiveUserFields(conversation: Conversation): Conversation {
    // Legacy assignment/status fields no longer control shared inbox access.
    conversation.status = ConversationStatusEnum.OPEN;
    conversation.assignedEmployeeId = null;
    conversation.assignedEmployee = null;
    if (conversation.adopter?.user) this.removeSensitiveFields(conversation.adopter.user);
    for (const message of conversation.messages ?? []) {
      if (message.sender) this.removeSensitiveFields(message.sender);
    }
    return conversation;
  }

  private removeSensitiveFields(user: User): void {
    delete (user as Partial<User>).password;
    delete (user as Partial<User>).refreshTokenVersion;
  }
}
