import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Roles } from "../roles/roles.decorator";
import { RolesGuard } from "../roles/roles.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { StoreService } from "./store.service";
import { StorePagniatedSuppliesDto } from "@shared/dto/StorePaginatedSupplies.dto";
import { StoreSupplyDetailsDto } from "@shared/dto/StoreSupplyDetails.dto";
import { StoreQueryDto } from "@shared/dto/StoreQuery.dto";
import { CreateSupplyDto, UpdateSupplyDto } from "@shared/dto/supply.dto";
import { SupplyService } from "../inventory/services/supply.service";
import { RequestWithUser } from '@shared/types/auth.types';
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('store')
export class StoreController{
  constructor(
          private readonly storeService: StoreService,
          private readonly inventorySupplyService: SupplyService,
  ){}

  @Get('supplies')
  @Roles('ADOPTER')
  async getSupplies(@Query() query: StoreQueryDto): Promise<StorePagniatedSuppliesDto>
  {
    return this.storeService.getSupplies(query);
  }

  @Get('supplies/:id')
  @Roles('ADOPTER')
  async getSupplyById(@Param('id') id: string): Promise<StoreSupplyDetailsDto>
  {
    return this.storeService.getSupplyById(id);
  }

  @Post('supplies')
  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  createSupply(@Body() createSupplyDto: CreateSupplyDto, @Req() req: RequestWithUser)
  {
    return this.inventorySupplyService.createSupply(createSupplyDto, req.user.userId);
  }

  @Patch('supplies/:id')
  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  updateSupply(@Param('id') id: string, @Body() updateSupplyDto: UpdateSupplyDto)
  {
    return this.inventorySupplyService.updateSupply(id, updateSupplyDto);
  }

  @Delete('supplies/:id')
  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  deactivateSupplyFromStore(@Param('id') id: string)
  {
    return this.inventorySupplyService.deactivateSupplyFromStore(id);
  }
}
