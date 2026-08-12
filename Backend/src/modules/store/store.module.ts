import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm";

import {
 Supply,
} from '../../database/entities';

import {StoreService} from './store.service'
import {StoreController} from './store.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Supply])],
  controllers: [StoreController],
  providers: [StoreService]
})

export class StoreModule {}