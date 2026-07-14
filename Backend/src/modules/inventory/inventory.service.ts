import { Injectable,} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Supplier, SupplierSupply, Supply } from "src/database/entities";
import { Repository } from "typeorm";
import { InventoryQueryDto } from "./DTOs/inventory-query.dto";
// import { TypeOrmModule } from "@nestjs/typeorm";

@Injectable()
export class InventoryService{
  constructor(
    @InjectRepository(Supply)
    private readonly supplyRepo: Repository<Supply>,

    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,

    @InjectRepository(SupplierSupply)
    private readonly supplierSupplyRepo: Repository<SupplierSupply>,      
  ){}
  async getSupplies(query: InventoryQueryDto): Promise<Supply[]>
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
    
    if (query.isActive)
    {
      queryBuilder.andWhere(
        'supply.isActive = :active',
        {active: query.isActive,},
      );
    }

    if (query.sortBy)
    {
      queryBuilder.orderBy(
        `supply.${query.sortBy}`,
        query.order ?? 'ASC',
      );
    }
      queryBuilder
        .skip(skip)
        .take(limit);
      return queryBuilder.getMany();//here TypeORM sends the query
    }
}