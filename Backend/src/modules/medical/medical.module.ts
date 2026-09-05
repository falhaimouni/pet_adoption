import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MedicalEntry } from '../../database/entities/medical-entry.entity';
import { MedicalRecord } from '../../database/entities/medical-record.entity';
import { Pet } from '../../database/entities/pet.entity';
import { MedicalController } from './medical.controller';
import { MedicalService } from './medical.service';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalRecord, MedicalEntry, Pet])],
  controllers: [MedicalController],
  providers: [MedicalService],
  exports: [MedicalService],
})
export class MedicalModule {}
