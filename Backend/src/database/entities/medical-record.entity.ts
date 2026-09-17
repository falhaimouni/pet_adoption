import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { FileUpload } from './file-upload.entity';
import { Pet } from './pet.entity';
import { MedicalEntry } from './medical-entry.entity';

@Entity('medical_records')
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid', { name: 'record_id' })
  recordId!: string;

  @Column({ name: 'pet_id', type: 'uuid', unique: true })
  petId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @OneToOne(() => Pet, (pet) => pet.medicalRecord, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pet_id' })
  pet!: Pet;

  @OneToMany(() => MedicalEntry, (entry) => entry.medicalRecord)
  entries!: MedicalEntry[];

  @OneToMany(() => FileUpload, (file) => file.medicalRecord)
  documents!: FileUpload[];
}
