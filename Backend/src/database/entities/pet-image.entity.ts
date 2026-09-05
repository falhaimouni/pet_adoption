import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FileUpload } from './file-upload.entity';
import { Pet } from './pet.entity';

@Entity('pet_images')
export class PetImage {
  @PrimaryGeneratedColumn('uuid', { name: 'image_id' })
  imageId!: string;

  @Column({ name: 'pet_id', type: 'uuid' })
  petId!: string;

  @Index('IDX_pet_images_file_id', { unique: true })
  @Column({ name: 'file_id', type: 'uuid' })
  fileId!: string;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamp' })
  uploadedAt!: Date;

  @ManyToOne(() => Pet, (pet) => pet.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  pet!: Pet;

  @ManyToOne(() => FileUpload, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'file_id' })
  file!: FileUpload;
}
