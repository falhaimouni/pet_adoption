import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards} from "@nestjs/common";
// import { TypeOrmModule } from "@nestjs/typeorm";
import {InventoryQueryDto} from "../../../../../shared/dto/inventory-query.dto";
import { CreateSupplyDto, UpdateSupplyDto } from "@shared/dto/supply.dto";
import { CreateSupplierDto, UpdateSupplierDto } from "@shared/dto/supplier.dto";
// import { Role } from "src/database/entities";
import { Roles } from "../../roles/roles.decorator";
import { RolesGuard } from "../../roles/roles.guard";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { SupplyService } from "../services/supply.service";
import { SupplierService } from "../services/supplier.service";
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController{
  constructor(
          private readonly supplyService: SupplyService,
          private readonly supplierService: SupplierService,
  ){}

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Get('supplies')
  getSupplies(@Query() query: InventoryQueryDto)
  { 
    return this.supplyService.getSupplies(query);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Get('supplies/low-stock')//use it later for notification
  getLowStockSupplies()
  {
    return this.supplyService.getLowStockSupplies();
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Get('supplies/:id')
  getSupplyByID(@Param('id') id: string)
  {
    return this.supplyService.getSupplyByID(id);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Post('supplies')
  createSupply(@Body() createSupplyDto: CreateSupplyDto)
  {
    return this.supplyService.createSupply(createSupplyDto);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Patch('supplies/:id')
  updateSupply(@Param('id') id: string, @Body() updateSupplyDto: UpdateSupplyDto)
  {
    return this.supplyService.updateSupply(id, updateSupplyDto);
  }

  @Roles('ADMIN', 'MANAGER')
  @Delete('supplies/:id')
  deleteSupply(@Param('id') id: string)
  {
    return this.supplyService.deleteSupply(id);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Get('suppliers')
  getSuppliers()
  {
    return this.supplierService.getSuppliers();
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Get('suppliers/:id')
  getSupplierById(@Param('id') id: string)
  {
    return this.supplierService.getSupplierById(id);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Post('suppliers')
  createSupplier(@Body() createSupplierDto: CreateSupplierDto)
  {
    return this.supplierService.createSupplier(createSupplierDto);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Patch('suppliers/:id')
  updateSupplier(@Body() updateSupplierDto: UpdateSupplierDto,@Param('id') id: string)
  {
    return this.supplierService.updateSupplier(id,updateSupplierDto);
  }

  @Roles('ADMIN', 'MANAGER')
  @Delete('suppliers/:id')
  deleteSupplier(@Param('id') id: string)
  {
    return this.supplierService.deleteSupplier(id);
  }
}
