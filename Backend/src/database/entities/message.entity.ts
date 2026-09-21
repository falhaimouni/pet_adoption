import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from './user.entity';
import { MessageType } from '@shared/enums/message-type.enum';

@Entity('messages')
@Index(['conversationId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid', { name: 'message_id' })
  messageId!: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId!: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId!: string;

  @Column({ name: 'message_text', type: 'text', nullable: true })
  messageText?: string | null;

  @Column({ name: 'file_url', type: 'text', nullable: true })
  fileUrl?: string | null;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;

  @Column({type:'enum', enum: MessageType, default: MessageType.TEXT})
  type!: MessageType;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.sentMessages, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sender_id' })
  sender!: User;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;
}
