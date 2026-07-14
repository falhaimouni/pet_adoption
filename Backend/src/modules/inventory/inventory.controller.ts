import { Controller, Delete, Get, Patch, Post, Query} from "@nestjs/common";
// import { TypeOrmModule } from "@nestjs/typeorm";
import {InventoryService} from './inventory.service'
import { InventoryQueryDto } from "../../../../shared/dto/inventory-query.dto";

@Controller('inventory')
export class InventoryController{
  constructor(
          private readonly invService: InventoryService,
  ){}

  @Get('supplies')
  getSupplies( @Query() query: InventoryQueryDto,)
  { 
    return this.invService.getSupplies(query);
  }

  @Get('supplies/low-stock')//use it later for notification
  getLowStockSupplies()
  {

  }

  @Get('supplies/:id')
  getSupplyById()
  {

  }

  @Post('supplies')
  createSupply()
  {

  }

  @Patch('supplies/:id')
  updateSupply()
  {

  }

  @Delete('supplies/:id')
  deleteSupply()
  {

  }

  @Get('suppliers')
  getSuppliers()
  {

  }

  @Get('suppliers/:id')
  getSupplierById()
  {

  }

  @Post('suppliers')
  createSupplier()
  {

  }

  @Patch('suppliers/:id')
  updateSupplier()
  {

  }

  @Delete('suppliers/:id')
  deleteSupplier()
  {

  }


  @Get('supplies/:id/suppliers')
  getSuppliersForSupply()
  {

  }

  @Post('supplies/:id/suppliers')
  addSupplierToSupply()
  {

  }

  @Delete('supplies/:id/suppliers/:supplierId')
  removeSupplierFromSupply()
  {

  }
}