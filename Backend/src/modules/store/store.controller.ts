import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { Roles } from "../roles/roles.decorator";
import { RolesGuard } from "../roles/roles.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { StoreService } from "./store.service";
import { StorePagniatedSuppliesDto } from "@shared/dto/StorePaginatedSupplies.dto";
import { StoreSupplyDetailsDto } from "@shared/dto/StoreSupplyDetails.dto";
import { StoreQueryDto } from "@shared/dto/StoreQuery.dto";
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('store')
export class StoreController{
  constructor(
          private readonly supplyService: StoreService,
  ){}

  @Get('supplies')
  @Roles('ADOPTER')
  async getSupplies(@Query() query: StoreQueryDto): Promise<StorePagniatedSuppliesDto>
  {
    return this.supplyService.getSupplies(query);
  }

  @Get('supplies/:id')
  @Roles('ADOPTER')
  async getSupplyById(@Param('id') id: string): Promise<StoreSupplyDetailsDto>
  {
    return this.supplyService.getSupplyById(id);
  }
}
