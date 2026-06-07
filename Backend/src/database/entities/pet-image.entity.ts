import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Pet } from './pet.entity';

@Entity('pet_images')
export class PetImage {
  @PrimaryGeneratedColumn('uuid', { name: 'image_id' })
  imageId!: string;

  @Column({ name: 'pet_id', type: 'uuid' })
  petId!: string;

  @Column({ name: 'image_url', type: 'text' })
  imageUrl!: string;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamp' })
  uploadedAt!: Date;

  @ManyToOne(() => Pet, (pet) => pet.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  pet!: Pet;
}
