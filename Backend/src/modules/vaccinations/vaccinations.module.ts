import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Pet } from '../../database/entities/pet.entity';
import { MedicalRecord } from '../../database/entities/medical-record.entity';
import { Vaccination } from '../../database/entities/vaccination.entity';
import { VaccinationsController } from './vaccinations.controller';
import { VaccinationsService } from './vaccinations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vaccination, Pet, MedicalRecord])],
  controllers: [VaccinationsController],
  providers: [VaccinationsService],
  exports: [VaccinationsService],
})
export class VaccinationsModule {}
