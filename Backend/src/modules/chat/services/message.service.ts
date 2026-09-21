import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository, InjectDataSource} from "@nestjs/typeorm";
import { Message } from "src/database/entities";
import { Repository, DataSource} from "typeorm";
import { Conversation } from "src/database/entities";
import { ConversationStatusEnum } from "@shared/enums/conversation-status.enum";
import { SendMessageDto } from "@shared/dto/message.dto";

const CHAT_ALLOWED_ROLES = ['ADOPTER', 'EMPLOYEE', 'ADMIN', 'MANAGER'] as const;

@Injectable()
export class MessageService {
  constructor(
        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,

        @InjectRepository(Conversation)
        private readonly conversationRepo: Repository<Conversation>,

        @InjectDataSource()
        private readonly dataSource: DataSource,) {}

        async sendMessage( conversationId: string, userId: string, role: string, dto: SendMessageDto): Promise<Message>
        {
                if (!CHAT_ALLOWED_ROLES.includes(role as (typeof CHAT_ALLOWED_ROLES)[number])) {
                        throw new ForbiddenException('You do not have access to this conversation');
                }

                return this.dataSource.transaction(async (manager) => {
                        const conversationRepo = manager.getRepository(Conversation);
                        const messageRepo = manager.getRepository(Message);
                        const conversation = await conversationRepo.findOne({
                                where: {conversationId},
                                relations: {
                                        adopter: true,
                                },
                        });

                        if (!conversation) {
                                throw new NotFoundException('Conversation not found');
                        }

                        if (conversation.status === ConversationStatusEnum.CLOSED) {
                                throw new ForbiddenException('Cannot send message to a closed conversation');
                        }

                        if (role === 'ADOPTER')
                        {
                                if (conversation.adopter.userId !== userId)
                                {
                                        throw new ForbiddenException('Cannot send message to a conversation you are not part of');
                                }
                        }

                        if (role === 'EMPLOYEE')
                        {
                                if (conversation.assignedEmployeeId &&
                                        conversation.assignedEmployeeId !== userId)
                                {
                                        throw new ForbiddenException('Cannot send message to a conversation you are not assigned to');
                                }
                                if (!conversation.assignedEmployeeId)
                                {
                                        const res = await manager
                                        .createQueryBuilder()
                                        .update(Conversation)
                                        .set({assignedEmployeeId: userId, status: ConversationStatusEnum.ASSIGNED})
                                        .where("conversation_id = :conversationId", { conversationId })
                                        .andWhere("assigned_employee_id IS NULL")
                                        .andWhere("status = :status", { status: ConversationStatusEnum.OPEN })
                                        .execute();
                                        //if someone else assigned the conversation before this employee, throw an error
                                        if (res.affected === 0) {
                                                throw new ForbiddenException('Cannot send message to a conversation you are not assigned to');
                                        }
                                }
                                

                                //old solution, but it has a race condition problem, so we use the query builder instead
                                // conversation.assignedEmployeeId = userId;
                                // conversation.status = ConversationStatusEnum.ASSIGNED;
                                // await this.conversationRepo.save(conversation);
                        }
                        //create the msg
                        const message = messageRepo.create({
                                senderId: userId,
                                conversationId: conversationId,
                                messageText: dto.messageText,
                                type: dto.type,
                                // isRead: false,
                        });
                        
                        return messageRepo.save(message);
                });
        }

        async getMessages(conversationId: string, userId: string, role: string): Promise<Message[]>
        {
                const conversation = await this.conversationRepo.findOne({
                        where: {conversationId},
                        relations:
                        {
                                adopter: true,
                        }
                })
                if (!conversation) {
                        throw new NotFoundException('Conversation not found');
                }

                if (role === 'ADOPTER')
                {
                        if (conversation.adopter.userId !== userId)
                        {
                                throw new ForbiddenException('Cannot view messages of a conversation you are not part of');
                        }
                }

                if (!CHAT_ALLOWED_ROLES.includes(role as (typeof CHAT_ALLOWED_ROLES)[number])) {
                        throw new ForbiddenException('Cannot view messages of a conversation you are not part of');
                }

                // if (role === 'EMPLOYEE')//we dont need this anymore because now the system is a shared inbox
                // {
                //         if (conversation.assignedEmployeeId !== userId)
                //         {
                //                 throw new ForbiddenException('Cannot view messages of a conversation you are not assigned to');
                //         }
                // }

                return this.messageRepo.find({
                        where: {conversationId},
                        relations: {
                                sender: true,
                        },
                        order: {
                                createdAt: 'ASC',
                        },
                });
        }

        async markMessagesAsRead(conversationId: string, userId: string, role: string): Promise<void>
        {
                const conversation = await this.conversationRepo.findOne({
                        where: {conversationId},
                        relations:
                        {
                                adopter: true,
                        }
                });
                if (!conversation) {
                        throw new NotFoundException('Conversation not found');
                }
                if (role === 'ADOPTER')
                {
                        if (conversation.adopter.userId !== userId)
                        {
                                throw new ForbiddenException('Cannot mark messages as read of a conversation you are not part of');
                        }
                        await this.messageRepo.createQueryBuilder()
                                .update(Message)
                                .set({isRead: true})
                                .where("conversation_id = :conversationId", { conversationId })
                                .andWhere("sender_id != :userId", { userId })
                                .andWhere("is_read = false")
                                .execute();
                        return;
                }
                if (role === 'EMPLOYEE' || role === 'ADMIN' || role === 'MANAGER')
                {
                        await this.messageRepo.createQueryBuilder()
                                .update(Message)
                                .set({isRead: true})
                                .where("conversation_id = :conversationId", { conversationId })
                                .andWhere("is_read = false")
                                .execute();
                        return;
                }
                throw new ForbiddenException('Cannot mark messages as read of a conversation you are not part of');
        }

}