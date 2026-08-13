import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdoptionRequest, Pet, Supplier, Supply } from '../../database/entities';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdoptionRequest, Pet, Supplier, Supply])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
