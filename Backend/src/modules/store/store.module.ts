import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm";

import {
 Product,
 Supply,
 Supplier,
} from '../../database/entities';

import {StoreService} from './store.service'
import {StoreController} from './store.controller'
import { SupplyService } from '../inventory/services/supply.service';
import { SupplierService } from '../inventory/services/supplier.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Supply, Supplier, Product]), NotificationsModule],
  controllers: [StoreController],
  providers: [StoreService, SupplyService, SupplierService]
})

export class StoreModule {}
