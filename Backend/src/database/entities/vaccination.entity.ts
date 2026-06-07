import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Pet } from './pet.entity';
import { User } from './user.entity';

@Entity('vaccinations')
export class Vaccination {
  @PrimaryGeneratedColumn('uuid', { name: 'vaccination_id' })
  vaccinationId!: string;

  @Column({ name: 'pet_id', type: 'uuid' })
  petId!: string;

  @Column({ name: 'vaccine_name', type: 'varchar', length: 160 })
  vaccineName!: string;

  @Column({ name: 'vaccination_date', type: 'date' })
  vaccinationDate!: string;

  @Column({ name: 'next_due_date', type: 'date', nullable: true })
  nextDueDate?: string | null;

  @Column({ name: 'veterinarian_id', type: 'uuid' })
  veterinarianId!: string;

  @ManyToOne(() => Pet, (pet) => pet.vaccinations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  pet!: Pet;

  @ManyToOne(() => User, (user) => user.vaccinations, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian!: User;
}
