import { Injectable, NotFoundException,ConflictException,ForbiddenException} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConversationStatusEnum } from "@shared/enums";
import { Adopter, Conversation } from "src/database/entities";
import { Repository } from "typeorm";

const CHAT_ALLOWED_ROLES = ['ADOPTER', 'EMPLOYEE', 'ADMIN', 'MANAGER'] as const;

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

        const existingConversation = await this.conversationRepo.findOne({
                where:
                {
                        adopterId: adopter.adopterId,
                        status: ConversationStatusEnum.OPEN
                } });
        if (existingConversation) {
                return existingConversation;
        }

        const conversation = this.conversationRepo.create({
                adopterId: adopter.adopterId,
                status: ConversationStatusEnum.OPEN,
                assignedEmployeeId: null,
        });
        return this.conversationRepo.save(conversation);
  }

  async getMyConversations(userId: string): Promise<Conversation[]> {
        const adopter = await this.adopterRepo.findOne({ where: { userId } });
        if (!adopter) {
                throw new NotFoundException('Adopter not found');
        }

        return this.conversationRepo.find({
                where: { adopterId: adopter.adopterId },
                relations: {
                        assignedEmployee: true,
                },
                order: {
                        updatedAt: 'DESC',//most recent conversations first
                },
        });
  }

  async getEmployeeConversations(): Promise<Conversation[]> 
  {
    return this.conversationRepo.find({
      where: [
        { status: ConversationStatusEnum.OPEN},
        {status: ConversationStatusEnum.ASSIGNED},
      ],
      relations: {
        adopter: true,
        assignedEmployee: true,
      },
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  // async assignConversation(conversationId: string, employeeId: string): Promise<Conversation> {
  //       const conversation = await this.conversationRepo.findOne({ where: { conversationId } });
  //       if (!conversation) {
  //               throw new NotFoundException('Conversation not found');
  //       }

  //       if (conversation.status === ConversationStatusEnum.CLOSED) {
  //               throw new ConflictException('Cannot assign a closed conversation');
  //       }

  //       if (conversation.assignedEmployeeId) {
  //               throw new ConflictException('Conversation is already assigned to an employee');
  //       }

  //       const employee = await this.userRepo.findOne({ where: { userId: employeeId } });
  //       if (!employee) {
  //               throw new NotFoundException('Employee not found');
  //       }

  //       conversation.assignedEmployeeId = employeeId;
  //       conversation.status = ConversationStatusEnum.ASSIGNED;
  //       return this.conversationRepo.save(conversation);
  // }

  async getConversation(conversationId: string, userId: string, role: string): Promise<Conversation> {
    if (!CHAT_ALLOWED_ROLES.includes(role as (typeof CHAT_ALLOWED_ROLES)[number])) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    const conversation = await this.conversationRepo.findOne({
      where: { conversationId },
      relations: {
        adopter: true,
        assignedEmployee: true,
        messages: {
          sender: true,
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (role === 'ADMIN' || role === 'MANAGER') {
      return conversation;
    }

    if (role === 'ADOPTER')
    {
      if(conversation.adopter.userId !== userId)
        throw new ForbiddenException('You do not have access to this conversation');
      return conversation;
    }

    if (role === 'EMPLOYEE')
    {
      return conversation;
    }

    throw new ForbiddenException('You do not have access to this conversation');
  }

  // async closeConversation(conversationId: string, employeeId: string): Promise<Conversation> {
  //   const conversation = await this.conversationRepo.findOne({ where: { conversationId } });
    
  //   if (!conversation) {
  //     throw new NotFoundException('Conversation not found');
  //   }
    
  //   if (conversation.status !== ConversationStatusEnum.ASSIGNED) {
  //     throw new ConflictException('Cannot close a conversation that is not assigned');
  //   }
    
  //   if (conversation.assignedEmployeeId !== employeeId) {
  //     throw new ForbiddenException('Cannot close a conversation you are not assigned to');
  //   }
  //   // if (conversation.status === ConversationStatusEnum.CLOSED) {
  //     // throw new ConflictException('Cannot close an already closed conversation');
  //   // }
  //   conversation.assignedEmployee = null;
  //   conversation.status = ConversationStatusEnum.CLOSED;
  //   return this.conversationRepo.save(conversation);
  // }

  async releaseConversation(conversationId: string, employeeId: string): Promise<Conversation>
  {
    const conversation = await this.conversationRepo.findOne({ where: { conversationId } });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.status !== ConversationStatusEnum.ASSIGNED) {
      throw new ConflictException('Cannot release a conversation that is not assigned');
    }

    if (conversation.assignedEmployeeId !== employeeId) {
      throw new ForbiddenException('Cannot release a conversation you are not assigned to');
    }

    conversation.assignedEmployeeId = null;
    conversation.status = ConversationStatusEnum.OPEN;
    return this.conversationRepo.save(conversation);
  }
}