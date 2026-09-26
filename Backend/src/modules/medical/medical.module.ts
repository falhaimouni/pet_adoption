import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsModule } from '../uploads/uploads.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { MedicalEntry } from '../../database/entities/medical-entry.entity';
import { MedicalRecord } from '../../database/entities/medical-record.entity';
import { Pet } from '../../database/entities/pet.entity';
import { User } from '../../database/entities/user.entity';
import { Vaccination } from '../../database/entities/vaccination.entity';
import { ActivityLog } from '../../database/entities/activity-log.entity';
import { MedicalController } from './medical.controller';
import { MedicalService } from './medical.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicalRecord, MedicalEntry, Pet, User, Vaccination, ActivityLog]),
    UploadsModule,
    NotificationsModule,
  ],
  controllers: [MedicalController],
  providers: [MedicalService],
  exports: [MedicalService],
})
export class MedicalModule {}
