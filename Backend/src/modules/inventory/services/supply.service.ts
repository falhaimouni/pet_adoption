import { ConflictException, Injectable, NotFoundException} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { Supplier, Supply } from "src/database/entities";
import { DataSource, QueryFailedError, Repository } from "typeorm";
import { InventoryQueryDto } from "../../../../../shared/dto/inventory-query.dto";
import { SupplyStatusEnum } from "@shared/enums";
import { CreateSupplierDto, UpdateSupplierDto } from "@shared/dto/supplier.dto";
import { CreateSupplyDto, UpdateSupplyDto } from "@shared/dto/supply.dto";
import { PaginatedSuppliesDto } from "@shared/dto/paginatedSupplies.dto";
import { NotificationsService } from "../../notifications/notifications.service";
// import { TypeOrmModule } from "@nestjs/typeorm";
// import {CreateSupplyDto, UpdateSupplyDto} from "../../../../shared/dto/supply.dto.ts"
// import {CreateSupplierDto, UpdateSupplierDto} from "../../../../shared/dto/supplier.dto.ts"

@Injectable()
export class SupplyService{
  constructor(
    @InjectRepository(Supply)
    private readonly supplyRepo: Repository<Supply>,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly notificationsService: NotificationsService,
  ){}
  async getSupplies(query: InventoryQueryDto): Promise<PaginatedSuppliesDto>
  {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.supplyRepo.createQueryBuilder('supply');
    if (query.search)
    {
      queryBuilder.andWhere('supply.supplyName ILIKE :search',
        {
          search: `%${query.search}%`,
        },
      )
    }
    if (query.category)
    {
      queryBuilder.andWhere('supply.category = :Category',
        {
          Category: query.category,
        },
      );
    }
    
    if (query.isActive !== undefined)
    {
      queryBuilder.andWhere(
        'supply.isActive = :active',
        {active: query.isActive,},
      );
    }

    const sotableColumns = ['supplyName', 'quantity', 'sellingPrice', 'lastUpdated'];
    if (query.sortBy && sotableColumns.includes(query.sortBy))
    {
      queryBuilder.orderBy(
        `supply.${query.sortBy}`,
        query.order ?? 'ASC',
      );
    }
    queryBuilder
      .skip(skip)
      .take(limit);
      const [supplies, total] = await queryBuilder.getManyAndCount();
    return { data: supplies, total, page, limit };//here TypeORM sends the query
   }

   async getSupplyByID(id: string)
   {
      const supply = await this.supplyRepo.findOne(
      {
        where: {supplyId: id,
          isActive:true
        },
        relations:{supplier: true}
      });
      if (!supply)
      {
        throw new NotFoundException('Supply not found');
      }
      return supply;
    }

    async getLowStockSupplies()
    {
      return await this.supplyRepo.createQueryBuilder('supply')
        .where('supply.isActive = :isActive', {isActive: true})
        .andWhere('supply.status = :status', {status: SupplyStatusEnum.AVAILABLE})
        .andWhere('supply.quantity <= supply.lowStockLimit')
        .leftJoinAndSelect('supply.supplier', 'supplier')
        .orderBy('supply.quantity', 'ASC')
        .getMany();
    }

    async createSupply(createSupplyDto: CreateSupplyDto)
    {
      const supplier = await this.supplyRepo.findOneBy({
        supplierId:createSupplyDto.supplierId,
        isActive: true
      });

      if(!supplier)
      {
        throw new NotFoundException('Supplier not found');
      }

      const existingSupply = await this.supplyRepo.findOne({
        where: {
          supplyName: createSupplyDto.supplyName,
          supplierId: createSupplyDto.supplierId,
          isActive: true
        }
      });

      if (existingSupply)
      {
        throw new ConflictException('Supply already exists for this supplier');
      }
      const supply = this.supplyRepo.create({
        ...createSupplyDto,//spread operator to copy properties from createSupplyDto)
        status: SupplyStatusEnum.AVAILABLE,
        sellingPrice: createSupplyDto.sellingPrice.toString(),
        purchasePrice: createSupplyDto.purchasePrice.toString(),
      });
      let savedSupply: Supply;
      try {
        savedSupply = await this.supplyRepo.save(supply);
      } catch (error) {
        if (error instanceof QueryFailedError && (error as any).code === '23505') {
          throw new ConflictException('Supply already exists for this supplier');
        }
        throw error;
      }
      await this.notifyLowStockIfNeeded(savedSupply);

      return savedSupply;
    }

    
    async updateSupply(id: string, updateSupplyDto: UpdateSupplyDto)
    {
      const savedSupply = await this.dataSource.transaction(async (manager) => {
        const supply = await manager.getRepository(Supply)
          .createQueryBuilder('supply')
          .setLock('pessimistic_write')
          .where('supply.supplyId = :id', { id })
          .andWhere('supply.isActive = :isActive', { isActive: true })
          .getOne();
        if (!supply) throw new NotFoundException('Supply not found');
        if (supply.status === SupplyStatusEnum.DISCONTINUED) {
          throw new ConflictException('Cannot update discontinued supply');
        }
        const wasLowStock = this.isLowStock(supply);
        if (updateSupplyDto.sellingPrice !== undefined) supply.sellingPrice = updateSupplyDto.sellingPrice.toString();
        if (updateSupplyDto.purchasePrice !== undefined) supply.purchasePrice = updateSupplyDto.purchasePrice.toString();
        Object.assign(supply, updateSupplyDto);
        const updated = await manager.getRepository(Supply).save(supply);
        return { updated, wasLowStock };
      });
      if (!savedSupply.wasLowStock && this.isLowStock(savedSupply.updated))
      {
        await this.notifyLowStock(savedSupply.updated);
      }

      return savedSupply.updated;
    }
        
    async deleteSupply(id: string)
    {
      const supply = await this.supplyRepo.findOneBy({
      supplyId: id,
      isActive: true
      });
      if (!supply)
      {
      throw new NotFoundException('Supply not found');
      }
      supply.isActive = false;
      await this.supplyRepo.save(supply);
      return { 
      success: true,
      message: 'Supply deleted successfully'
      };
    }

    private async notifyLowStockIfNeeded(supply: Supply): Promise<void>
    {
      if (this.isLowStock(supply))
      {
        await this.notifyLowStock(supply);
      }
    }

    private isLowStock(supply: Supply): boolean
    {
      if (
        supply.status !== SupplyStatusEnum.AVAILABLE &&
        supply.status !== SupplyStatusEnum.OUT_OF_STOCK
      )
      {
        return false;
      }

      return supply.quantity <= supply.lowStockLimit;
    }

    private async notifyLowStock(supply: Supply): Promise<void>
    {
      const title =
        supply.quantity <= 0 ? 'Supply out of stock' : 'Supply low stock';
      const message =
        `${supply.supplyName} has quantity ${supply.quantity}. ` +
        `Minimum stock is ${supply.lowStockLimit}.`;

      await this.notificationsService.createInventoryAlert(title, message);
    }
}
