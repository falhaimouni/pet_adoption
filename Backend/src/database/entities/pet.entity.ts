import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AdoptionRequest } from './adoption-request.entity';
import { MedicalRecord } from './medical-record.entity';
import { PetImage } from './pet-image.entity';
import { User } from './user.entity';
import { Vaccination } from './vaccination.entity';

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn('uuid', { name: 'pet_id' })
  petId!: string;

  @Index()
  @Column({ name: 'pet_name', type: 'varchar', length: 120 })
  petName!: string;

  @Column({ type: 'varchar', length: 80 })
  species!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  breed?: string | null;

  @Column({ type: 'integer', nullable: true })
  age?: number | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  gender?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  color?: string | null;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  weight?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'health_status', type: 'varchar', length: 80, nullable: true })
  healthStatus?: string | null;

  @Index()
  @Column({ name: 'adoption_status', type: 'varchar', length: 80, default: 'available' })
  adoptionStatus!: string;

  @Column({ name: 'arrival_date', type: 'date', nullable: true })
  arrivalDate?: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date | null;

  @ManyToOne(() => User, (user) => user.createdPets, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdByUser?: User | null;

  @OneToMany(() => PetImage, (image) => image.pet)
  images!: PetImage[];

  @OneToOne(() => MedicalRecord, (record) => record.pet)
  medicalRecord?: MedicalRecord;

  @OneToMany(() => Vaccination, (vaccination) => vaccination.pet)
  vaccinations!: Vaccination[];

  @OneToMany(() => AdoptionRequest, (request) => request.pet)
  adoptionRequests!: AdoptionRequest[];
}
