import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Pet } from '../../database/entities/pet.entity';
import { PetImage } from '../../database/entities/pet-image.entity';
import { MedicalEntry } from '../../database/entities/medical-entry.entity';
import { MedicalRecord } from '../../database/entities/medical-record.entity';
import { Vaccination } from '../../database/entities/vaccination.entity';
import { Adoption } from '../../database/entities/adoption.entity';
import { UploadsModule } from '../uploads/uploads.module';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';

@Module({
  imports: [
    UploadsModule,
    TypeOrmModule.forFeature([
      Pet,
      PetImage,
      MedicalRecord,
      MedicalEntry,
      Vaccination,
      Adoption,
    ]),
  ],
  controllers: [PetsController],
  providers: [PetsService],
  exports: [PetsService],
})
export class PetsModule {}
