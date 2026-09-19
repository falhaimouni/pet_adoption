import { FileUploadCategory } from '@shared/enums';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MedicalRecord } from './medical-record.entity';
import { User } from './user.entity';

@Entity('file_uploads')
export class FileUpload {
  @PrimaryGeneratedColumn('uuid', { name: 'file_id' })
  fileId!: string;

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy?: string | null;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ name:'file_size', type:'int' })
  fileSize!: number;

  @Column({ name: 'category', type: 'varchar', length: 40 })
  category!: FileUploadCategory;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 120, nullable: true })
  mimeType?: string | null;

  @Column({ name: 'medical_record_id', type: 'uuid', nullable: true })
  medicalRecordId?: string | null;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamp' })
  uploadedAt!: Date;

  @ManyToOne(() => User, (user) => user.uploadedFiles, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedByUser?: User | null;

  @ManyToOne(() => MedicalRecord, (medicalRecord) => medicalRecord.documents, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord?: MedicalRecord | null;
}
