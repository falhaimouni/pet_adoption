import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Adopter } from './adopter.entity';
import { Message } from './message.entity';
import { User } from './user.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid', { name: 'conversation_id' })
  conversationId!: string;

  @Column({ name: 'adopter_id', type: 'uuid' })
  adopterId!: string;

  @Column({ name: 'assigned_employee_id', type: 'uuid', nullable: true })
  assignedEmployeeId?: string | null;

  @Column({ type: 'varchar', length: 40, default: 'open' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => Adopter, (adopter) => adopter.conversations, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'adopter_id' })
  adopter!: Adopter;

  @ManyToOne(() => User, (user) => user.assignedConversations, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_employee_id' })
  assignedEmployee?: User | null;

  @OneToMany(() => Message, (message) => message.conversation)
  messages!: Message[];
}
