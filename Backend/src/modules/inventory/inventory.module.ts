import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm";

import {
 Supply,
 Supplier,
} from '../../database/entities';

import {SupplierService} from './services/supplier.service'
import {SupplyService} from './services/supply.service'
import {InventoryController} from './conrollers/inventory.controller'
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Supply, Supplier]), NotificationsModule],
  controllers: [InventoryController],
  providers: [SupplyService, SupplierService]
})

export class InventoryModule {}
