import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('friendships')
@Unique('UQ_friendships_user_pair', ['user1Id', 'user2Id'])
export class Friendship {
  @PrimaryGeneratedColumn('uuid', { name: 'friendship_id' })
  friendshipId!: string;

  @Column({ name: 'user1_id', type: 'uuid' })
  user1Id!: string;

  @Column({ name: 'user2_id', type: 'uuid' })
  user2Id!: string;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string | null;

  @Column({ name: 'is_system_generated', type: 'boolean', default: false })
  isSystemGenerated!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.friendshipsAsUser1, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user1_id' })
  user1!: User;

  @ManyToOne(() => User, (user) => user.friendshipsAsUser2, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user2_id' })
  user2!: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy?: User | null;
}