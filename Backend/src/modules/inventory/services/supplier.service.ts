import { ConflictException, Injectable, NotFoundException} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Supplier, Supply } from "src/database/entities";
import { QueryFailedError, Repository } from "typeorm";
import { InventoryQueryDto } from "../../../../../shared/dto/inventory-query.dto";
import { SupplyStatusEnum } from "@shared/enums";
import { NotificationTypeEnum, RolesEnum } from "@shared/enums";
import { CreateSupplierDto, UpdateSupplierDto } from "@shared/dto/supplier.dto";
import { CreateSupplyDto, UpdateSupplyDto } from "@shared/dto/supply.dto";
import { PaginatedSuppliesDto } from "@shared/dto/paginatedSupplies.dto";
import { NotificationsService } from "../../notifications/notifications.service";
// import { TypeOrmModule } from "@nestjs/typeorm";
// import {CreateSupplyDto, UpdateSupplyDto} from "../../../../shared/dto/supply.dto.ts"
// import {CreateSupplierDto, UpdateSupplierDto} from "../../../../shared/dto/supplier.dto.ts"

@Injectable()
export class SupplierService{
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,

    private readonly notificationsService: NotificationsService,
  ){}
          
    async getSuppliers()
    {
      return await this.supplierRepo.find({
      where: {isActive: true},
      order: {supplierName: 'ASC'}
      });
    }

    async getSupplierById(id: string)
    {
      const supplier = await this.supplierRepo.findOne({
      where: {
      supplierId: id,
      isActive: true,},
      relations: {supplies: true}
      });
      if (!supplier)
      {
              throw new NotFoundException('Supplier not found');
      }
      return supplier;
    }

    async createSupplier(createSupplierDto: CreateSupplierDto)
    {
      const existingSupplier = await this.supplierRepo.findOne({
        where:
        {
          supplierName: createSupplierDto.supplierName,//make it case sensetive
        }
      });
      if (existingSupplier)
      {
        if (existingSupplier.isActive)
          throw new ConflictException('Supplier already exists');
        else
        {
          Object.assign(existingSupplier,createSupplierDto);
          existingSupplier.isActive = true;
          const restored = await this.supplierRepo.save(existingSupplier);
          await this.notifyStaff('Supplier restored', `${restored.supplierName} was restored.`);
          return restored;
        }
      }
      const supplier = this.supplierRepo.create(createSupplierDto);
      try {
        const saved = await this.supplierRepo.save(supplier);
        await this.notifyStaff('Supplier created', `${saved.supplierName} was added.`);
        return saved;
      } catch (error) {
        if (error instanceof QueryFailedError && (error as any).code === '23505') {
          throw new ConflictException('Supplier already exists');
        }
        throw error;
      }
    }

    async updateSupplier(id: string, updateSupplierDto: UpdateSupplierDto)
    {
      if (updateSupplierDto.supplierName)
      {
        const dupExist = await this.supplierRepo.findOneBy({
          supplierName: updateSupplierDto.supplierName,
          isActive:true
        })
        if (dupExist && dupExist.supplierId !== id)
        {
          throw new ConflictException('Supplier already exists');
        }
      }

      const existingSupplier = await this.supplierRepo.findOneBy({
          supplierId: id,
          isActive:true
      });
      if (!existingSupplier)
        throw new NotFoundException('Supplier not found');

      Object.assign(existingSupplier,updateSupplierDto);
      const saved = await this.supplierRepo.save(existingSupplier);
      await this.notifyStaff('Supplier updated', `${saved.supplierName} was updated.`);
      return saved;
    }

    async deleteSupplier(id: string)
    {
      const supplier = await this.supplierRepo.findOneBy({
          supplierId: id,
          isActive: true
      });
      if (!supplier)
      {
        throw new NotFoundException('Supplier not found');
      }

      supplier.isActive = false;
      await this.supplierRepo.save(supplier);
      await this.notifyStaff('Supplier deleted', `${supplier.supplierName} was deleted.`);
      return{
        success: true,
        message: 'Supplier deleted successfully'
      }
    }

    private notifyStaff(title: string, message: string) {
      return this.notificationsService.notifyRoles(
        [RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE],
        title,
        message,
        NotificationTypeEnum.INVENTORY,
      );
    }
}
