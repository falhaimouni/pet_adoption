import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  ActivityLog,
  Adoption,
  AdoptionRequest,
  Conversation,
  MedicalRecord,
  Message,
  Pet,
  Supplier,
  Supply,
  User,
  Vaccination,
} from '../../database/entities';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActivityLog,
      Adoption,
      AdoptionRequest,
      Conversation,
      MedicalRecord,
      Message,
      Pet,
      Supplier,
      Supply,
      User,
      Vaccination,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
