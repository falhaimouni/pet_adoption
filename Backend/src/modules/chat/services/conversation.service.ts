import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CHAT_ALLOWED_ROLES } from '@shared/constants/chat.constants';
import { ConversationStatusEnum } from '@shared/enums';
import { Adopter, Conversation, User } from '../../../database/entities';
import { In, QueryFailedError, Repository } from 'typeorm';

type ChatRole = (typeof CHAT_ALLOWED_ROLES)[number];

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Adopter)
    private readonly adopterRepo: Repository<Adopter>,
  ) {}

  async createConversation(userId: string): Promise<Conversation> {
    const adopter = await this.adopterRepo.findOne({ where: { userId } });
    if (!adopter) {
      throw new NotFoundException('Adopter not found');
    }

    const activeStatuses = [
      ConversationStatusEnum.OPEN,
      ConversationStatusEnum.ASSIGNED,
    ];
    const existingConversation = await this.conversationRepo.findOne({
      where: {
        adopterId: adopter.adopterId,
        status: In(activeStatuses),
      },
    });
    if (existingConversation) {
      return existingConversation;
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
            status: In(activeStatuses),
          },
        });
        if (concurrentConversation) return concurrentConversation;
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
      relations: { assignedEmployee: true },
      order: { updatedAt: 'DESC' },
    });
    return conversations.map((conversation) =>
      this.removeSensitiveUserFields(conversation),
    );
  }

  async getEmployeeConversations(): Promise<Conversation[]> {
    const conversations = await this.conversationRepo.find({
      where: [
        { status: ConversationStatusEnum.OPEN },
        { status: ConversationStatusEnum.ASSIGNED },
      ],
      relations: { adopter: { user: true }, assignedEmployee: true },
      order: { updatedAt: 'DESC' },
    });
    return conversations.map((conversation) =>
      this.removeSensitiveUserFields(conversation),
    );
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
        adopter: true,
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

    return this.removeSensitiveUserFields(conversation);
  }

  async releaseConversation(
    conversationId: string,
    staffUserId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepo.findOne({
      where: { conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (conversation.status !== ConversationStatusEnum.ASSIGNED) {
      throw new ConflictException(
        'Cannot release a conversation that is not assigned',
      );
    }
    if (conversation.assignedEmployeeId !== staffUserId) {
      throw new ForbiddenException(
        'Cannot release a conversation you are not assigned to',
      );
    }

    conversation.assignedEmployeeId = null;
    conversation.status = ConversationStatusEnum.OPEN;
    return this.conversationRepo.save(conversation);
  }

  async updateStatus(
    conversationId: string,
    employeeId: string,
    status?: 'OPEN' | 'CLOSED',
  ): Promise<Conversation> {
    if (!status) {
      throw new ConflictException('Conversation status is required');
    }

    const conversation = await this.conversationRepo.findOne({
      where: { conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (status === 'CLOSED') {
      if (
        conversation.status !== ConversationStatusEnum.ASSIGNED ||
        conversation.assignedEmployeeId !== employeeId
      ) {
        throw new ForbiddenException(
          'Only the assigned employee can close this conversation',
        );
      }
      conversation.status = ConversationStatusEnum.CLOSED;
      return this.conversationRepo.save(conversation);
    }

    if (conversation.status !== ConversationStatusEnum.CLOSED) {
      throw new ConflictException('Only closed conversations can be reopened');
    }
    conversation.status = ConversationStatusEnum.OPEN;
    conversation.assignedEmployeeId = null;
    return this.conversationRepo.save(conversation);
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
    if (conversation.assignedEmployee) {
      this.removeSensitiveFields(conversation.assignedEmployee);
    }
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
