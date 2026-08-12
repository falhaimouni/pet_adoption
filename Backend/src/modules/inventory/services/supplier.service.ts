import { ConflictException, Injectable, NotFoundException} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Supplier, Supply } from "src/database/entities";
import { Repository } from "typeorm";
import { InventoryQueryDto } from "../../../../../shared/dto/inventory-query.dto";
import { SupplyStatusEnum } from "@shared/enums";
import { CreateSupplierDto, UpdateSupplierDto } from "@shared/dto/supplier.dto";
import { CreateSupplyDto, UpdateSupplyDto } from "@shared/dto/supply.dto";
import { PaginatedSuppliesDto } from "@shared/dto/paginatedSupplies.dto";
// import { TypeOrmModule } from "@nestjs/typeorm";
// import {CreateSupplyDto, UpdateSupplyDto} from "../../../../shared/dto/supply.dto.ts"
// import {CreateSupplierDto, UpdateSupplierDto} from "../../../../shared/dto/supplier.dto.ts"

@Injectable()
export class SupplierService{
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,   
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
          return await this.supplierRepo.save(existingSupplier);
        }
      }
      const supplier = this.supplierRepo.create(createSupplierDto);
      return await this.supplierRepo.save(supplier);
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
      return await this.supplierRepo.save(existingSupplier);
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
      return{
        success: true,
        message: 'Supplier deleted successfully'
      }
    }
}