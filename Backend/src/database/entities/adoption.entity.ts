import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AdoptionRequest } from './adoption-request.entity';

@Entity('adoptions')
export class Adoption {
  @PrimaryGeneratedColumn('uuid', { name: 'adoption_id' })
  adoptionId!: string;

  @Column({ name: 'request_id', type: 'uuid', unique: true })
  requestId!: string;

  @Column({ name: 'adoption_date', type: 'date' })
  adoptionDate!: string;

  @Column({ name: 'adoption_fee', type: 'decimal', precision: 10, scale: 2, nullable: true })
  adoptionFee?: string | null;

  @Column({ name: 'contract_status', type: 'varchar', length: 80, default: 'pending' })
  contractStatus!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToOne(() => AdoptionRequest, (request) => request.adoption, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'request_id' })
  request!: AdoptionRequest;
}
