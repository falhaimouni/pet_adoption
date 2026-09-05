import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Adoption } from './adoption.entity';
import { Adopter } from './adopter.entity';
import { Pet } from './pet.entity';
import { User } from './user.entity';

@Entity('adoption_requests')
@Unique(['adopterId', 'petId'])
export class AdoptionRequest {
  @PrimaryGeneratedColumn('uuid', { name: 'request_id' })
  requestId!: string;

  @Column({ name: 'adopter_id', type: 'uuid' })
  adopterId!: string;

  @Column({ name: 'pet_id', type: 'uuid' })
  petId!: string;

  @Column({ type: 'varchar', length: 40, default: 'pending' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ name: 'request_date', type: 'date' })
  requestDate!: string;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy?: string | null;

  @ManyToOne(() => Adopter, (adopter) => adopter.adoptionRequests, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'adopter_id' })
  adopter!: Adopter;

  @ManyToOne(() => Pet, (pet) => pet.adoptionRequests, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pet_id' })
  pet!: Pet;

  @ManyToOne(() => User, (user) => user.reviewedAdoptionRequests, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer?: User | null;

  @OneToOne(() => Adoption, (adoption) => adoption.request)
  adoption?: Adoption;
}
