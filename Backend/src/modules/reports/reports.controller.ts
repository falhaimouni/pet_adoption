import {
  Controller,
  Get,
  Header,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  AdoptionReportQueryDto,
  InventoryReportQueryDto,
  PetReportQueryDto,
} from '@shared/dto';
import { RolesEnum } from '@shared/enums';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE)
  @Get('adoptions')
  getAdoptions(@Query() query: AdoptionReportQueryDto) {
    return this.reportsService.getAdoptionReport(query);
  }

  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE)
  @Get('adoptions/export/csv')
  @Header('Content-Type', 'text/csv')
  async exportAdoptionsCsv(@Query() query: AdoptionReportQueryDto) {
    const buffer = await this.reportsService.exportAdoptionsCsv(query);
    return this.file(buffer, 'adoption-report.csv', 'text/csv');
  }

  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE)
  @Get('adoptions/export/pdf')
  @Header('Content-Type', 'application/pdf')
  async exportAdoptionsPdf(@Query() query: AdoptionReportQueryDto) {
    const buffer = await this.reportsService.exportAdoptionsPdf(query);
    return this.file(buffer, 'adoption-report.pdf', 'application/pdf');
  }

  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE)
  @Get('adoptions/export/xml')
  @Header('Content-Type', 'application/xml')
  async exportAdoptionsXml(@Query() query: AdoptionReportQueryDto) {
    const buffer = await this.reportsService.exportAdoptionsXml(query);
    return this.file(buffer, 'adoption-report.xml', 'application/xml');
  }

  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER)
  @Get('inventory')
  getInventory(@Query() query: InventoryReportQueryDto) {
    return this.reportsService.getInventoryReport(query);
  }

  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER)
  @Get('inventory/export/csv')
  @Header('Content-Type', 'text/csv')
  async exportInventoryCsv(@Query() query: InventoryReportQueryDto) {
    const buffer = await this.reportsService.exportInventoryCsv(query);
    return this.file(buffer, 'inventory-report.csv', 'text/csv');
  }

  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER)
  @Get('inventory/export/pdf')
  @Header('Content-Type', 'application/pdf')
  async exportInventoryPdf(@Query() query: InventoryReportQueryDto) {
    const buffer = await this.reportsService.exportInventoryPdf(query);
    return this.file(buffer, 'inventory-report.pdf', 'application/pdf');
  }

  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER)
  @Get('inventory/export/xml')
  @Header('Content-Type', 'application/xml')
  async exportInventoryXml(@Query() query: InventoryReportQueryDto) {
    const buffer = await this.reportsService.exportInventoryXml(query);
    return this.file(buffer, 'inventory-report.xml', 'application/xml');
  }

  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE, RolesEnum.VET)
  @Get('pets')
  getPets(@Query() query: PetReportQueryDto) {
    return this.reportsService.getPetReport(query);
  }

  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE, RolesEnum.VET)
  @Get('pets/export/csv')
  @Header('Content-Type', 'text/csv')
  async exportPetsCsv(@Query() query: PetReportQueryDto) {
    const buffer = await this.reportsService.exportPetsCsv(query);
    return this.file(buffer, 'pet-report.csv', 'text/csv');
  }

  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE, RolesEnum.VET)
  @Get('pets/export/pdf')
  @Header('Content-Type', 'application/pdf')
  async exportPetsPdf(@Query() query: PetReportQueryDto) {
    const buffer = await this.reportsService.exportPetsPdf(query);
    return this.file(buffer, 'pet-report.pdf', 'application/pdf');
  }

  @Roles(RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE, RolesEnum.VET)
  @Get('pets/export/xml')
  @Header('Content-Type', 'application/xml')
  async exportPetsXml(@Query() query: PetReportQueryDto) {
    const buffer = await this.reportsService.exportPetsXml(query);
    return this.file(buffer, 'pet-report.xml', 'application/xml');
  }

  private file(buffer: Buffer, filename: string, type: string): StreamableFile {
    return new StreamableFile(buffer, {
      type,
      disposition: `attachment; filename="${filename}"`,
    });
  }
}
