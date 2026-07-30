import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards} from "@nestjs/common";
// import { TypeOrmModule } from "@nestjs/typeorm";
import {InventoryService} from './inventory.service'
import {InventoryQueryDto} from "../../../../shared/dto/inventory-query.dto";
import { CreateSupplyDto, UpdateSupplyDto } from "@shared/dto/supply.dto";
import { CreateSupplierDto, UpdateSupplierDto } from "@shared/dto/supplier.dto";
// import { Role } from "src/database/entities";
import { Roles } from "../roles/roles.decorator";
import { RolesGuard } from "../roles/roles.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController{
  constructor(
          private readonly invService: InventoryService,
  ){}

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE','VET', 'ADOPTER')
  @Get('supplies')
  getSupplies(@Query() query: InventoryQueryDto)
  { 
    return this.invService.getSupplies(query);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE','VET', 'ADOPTER')
  @Get('supplies/low-stock')//use it later for notification
  getLowStockSupplies()
  {
    return this.invService.getLowStockSupplies();
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE','VET', 'ADOPTER')
  @Get('supplies/:id')
  getSupplyByID(@Param('id') id: string)
  {
    return this.invService.getSupplyByID(id);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Post('supplies')
  createSupply(@Body() createSupplyDto: CreateSupplyDto)
  {
    return this.invService.createSupply(createSupplyDto);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Patch('supplies/:id')
  updateSupply(@Param('id') id: string, @Body() updateSupplyDto: UpdateSupplyDto)
  {
    return this.invService.updateSupply(id, updateSupplyDto);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Delete('supplies/:id')
  deleteSupply(@Param('id') id: string)
  {
    return this.invService.deleteSupply(id);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE','VET', 'ADOPTER')
  @Get('suppliers')
  getSuppliers()
  {
    return this.invService.getSuppliers();
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE','VET', 'ADOPTER','VET')
  @Get('suppliers/:id')
  getSupplierById(@Param('id') id: string)
  {
    return this.invService.getSupplierById(id);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Post('suppliers')
  createSupplier(@Body() createSupplierDto: CreateSupplierDto)
  {
    return this.invService.createSupplier(createSupplierDto);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Patch('suppliers/:id')
  updateSupplier(@Body() updateSupplierDto: UpdateSupplierDto,@Param('id') id: string)
  {
    return this.invService.updateSupplier(id,updateSupplierDto);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Delete('suppliers/:id')
  deleteSupplier(@Param('id') id: string)
  {
    return this.invService.deleteSupplier(id);
  }
}