import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Adoption } from '../../database/entities/adoption.entity';
import { AdoptionRequest } from '../../database/entities/adoption-request.entity';
import { Adopter } from '../../database/entities/adopter.entity';
import { ActivityLog } from '../../database/entities/activity-log.entity';
import { Pet } from '../../database/entities/pet.entity';
import { User } from '../../database/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdoptionsController } from './adoptions.controller';
import { AdoptionsService } from './adoptions.service';

@Module({
  imports: [
    NotificationsModule,
    TypeOrmModule.forFeature([
      AdoptionRequest,
      Adoption,
      Adopter,
      ActivityLog,
      Pet,
      User,
    ]),
  ],
  controllers: [AdoptionsController],
  providers: [AdoptionsService],
  exports: [AdoptionsService],
})
export class AdoptionsModule {}
