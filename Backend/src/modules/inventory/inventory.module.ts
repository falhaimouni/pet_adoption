import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm";

import {
 Supply,
 Supplier,
 SupplierSupply,
} from '../../database/entities';

import {InventoryService} from './inventory.service'
import {InventoryController} from './inventory.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Supply, Supplier, SupplierSupply])],
  controllers: [InventoryController],
  providers: [InventoryService]
})

export class InventoryModule {}