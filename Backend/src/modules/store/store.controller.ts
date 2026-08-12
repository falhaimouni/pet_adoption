import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards} from "@nestjs/common";
import { Roles } from "../roles/roles.decorator";
import { RolesGuard } from "../roles/roles.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { StoreService } from "./store.service";
import { InventoryQueryDto } from "@shared/dto/inventory-query.dto";
import { StorePagniatedSuppliesDto } from "@shared/dto/StorePaginatedSupplies.dto";
import { StoreSupplyDetailsDto } from "@shared/dto/StoreSupplyDetails.dto";
import { StoreHomeDto } from "@shared/dto/store-home.dto";
import { SupplyStatusEnum } from "@shared/enums/supply-status.enum";
import { StoreQueryDto } from "@shared/dto/StoreQuery.dto";
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('store')
export class StoreController{
  constructor(
          private readonly supplyService: StoreService,
  ){}

  @Get('supplies')
  @Roles('ADMIN', 'MANAGER', 'VET', 'EMPLOYEE', 'ADOPTER')
  async getSupplies(@Query() query: StoreQueryDto): Promise<StorePagniatedSuppliesDto>
  {
    return this.supplyService.getSupplies(query);
  }

  @Get('supplies/:id')
  @Roles('ADMIN', 'MANAGER', 'VET', 'EMPLOYEE', 'ADOPTER')
  async getSupplyById(@Param('id') id: string): Promise<StoreSupplyDetailsDto>
  {
    return this.supplyService.getSupplyById(id);
  }

  // @Get()
  // @Roles('ADMIN', 'MANAGER', 'VET', 'EMPLOYEE', 'ADOPTER')
  // async getStoreHome(): Promise<StoreHomeDto>
  // {
  //   return this.supplyService.getStoreHome();
  // }
}