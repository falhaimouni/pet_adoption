import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AdoptionRequest } from './adoption-request.entity';
import { Conversation } from './conversation.entity';
import { User } from './user.entity';

@Entity('adopters')
export class Adopter {
  @PrimaryGeneratedColumn('uuid', { name: 'adopter_id' })
  adopterId!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @Column({ type: 'text', nullable: true })
  address?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string | null;

  @Column({ name: 'registration_date', type: 'date' })
  registrationDate!: string;

  @OneToOne(() => User, (user) => user.adopterProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => AdoptionRequest, (request) => request.adopter)
  adoptionRequests!: AdoptionRequest[];

  @OneToMany(() => Conversation, (conversation) => conversation.adopter)
  conversations!: Conversation[];
}
