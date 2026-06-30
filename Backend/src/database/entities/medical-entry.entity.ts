import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { MedicalRecord } from './medical-record.entity';
import { User } from './user.entity';

@Entity('medical_entries')
export class MedicalEntry {
  @PrimaryGeneratedColumn('uuid', { name: 'entry_id' })
  entryId!: string;

  @Column({ name: 'record_id', type: 'uuid' })
  recordId!: string;

  @Column({ name: 'veterinarian_id', type: 'uuid' })
  veterinarianId!: string;

  @Column({ type: 'text' })
  diagnosis!: string;

  @Column({ type: 'text' })
  treatment!: string;

  @Column({ name: 'vaccination_status', type: 'varchar', length: 80 })
  vaccinationStatus!: string;

  @Column({ name: 'medical_date', type: 'date' })
  medicalDate!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => MedicalRecord, (record) => record.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'record_id' })
  medicalRecord!: MedicalRecord;

  @ManyToOne(() => User, (user) => user.medicalEntries, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian!: User;
}
