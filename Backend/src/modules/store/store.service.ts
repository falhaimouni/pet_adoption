import { Supply } from "src/database/entities";
import { Injectable , NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
// import { InventoryQueryDto } from "@shared/dto/inventory-query.dto";
import { SupplyStatusEnum } from "@shared/enums";
import { StorePagniatedSuppliesDto } from "@shared/dto/StorePaginatedSupplies.dto";
import { StoreSupplyDto } from "@shared/dto/storeSupply.dto";
import { StoreSupplyDetailsDto } from "@shared/dto/StoreSupplyDetails.dto";
import { StoreQueryDto } from "@shared/dto/StoreQuery.dto";
// import { StoreHomeDto } from "@shared/dto/store-home.dto";

@Injectable()
export class StoreService{
  constructor(
    @InjectRepository(Supply)
    private readonly supplyRepo: Repository<Supply>,   
  ){}

  async getSupplies(query: StoreQueryDto): Promise<StorePagniatedSuppliesDto>
  {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.supplyRepo.createQueryBuilder('supply');
    queryBuilder.andWhere('supply.status = :status', {status: SupplyStatusEnum.AVAILABLE})
      .andWhere('supply.quantity > 0')
      .andWhere('supply.isActive = :active', {active: true})
      .andWhere('supply.storeListed = :storeListed', {storeListed: true})
      .innerJoin('supply.product', 'product')
      .andWhere('product.isActive = :productActive', { productActive: true });

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
      queryBuilder.andWhere('supply.category = :category',
        {
          category: query.category,
        },
      );
    }

    if (query.minPrice)
    {
      queryBuilder.andWhere('supply.sellingPrice >= :minPrice',
        {
          minPrice: query.minPrice,
        },
      );
    }

    if (query.maxPrice)
    {
      queryBuilder.andWhere('supply.sellingPrice <= :maxPrice',
        {
          maxPrice: query.maxPrice,
        },
      );
    }

    const sortableColumns = ['supplyName', 'category', 'sellingPrice'];
    if (query.sortBy && sortableColumns.includes(query.sortBy))
    {
      queryBuilder.orderBy(
        `supply.${query.sortBy}`,
        query.order ?? 'ASC',
      );
    }
    queryBuilder.skip(skip).take(limit);
  
    const [supplies, total] = await queryBuilder.getManyAndCount();
  
    const data: StoreSupplyDto[] = supplies.map((supply) => ({
      supplyId: supply.supplyId,
      productId: supply.productId,
      supplyName: supply.supplyName,
      category: supply.category,
      sellingPrice: supply.sellingPrice,
      inStock: supply.quantity > 0,
      storeListed: supply.storeListed,
    }));  
    return { data, total, page, limit };//here TypeORM sends the query
  }

  async getSupplyById(id: string) : Promise<StoreSupplyDetailsDto>
  {
    const supply = await this.supplyRepo.createQueryBuilder('supply')
      .where('supply.supplyId = :id', {id})
      .andWhere('supply.isActive = :active', {active: true})
      .andWhere('supply.storeListed = :storeListed', {storeListed: true})
      .andWhere('supply.status = :status', {status: SupplyStatusEnum.AVAILABLE})
      .andWhere('supply.quantity > 0')
      .innerJoin('supply.product', 'product')
      .andWhere('product.isActive = :productActive', { productActive: true })
      .getOne();
    if (!supply)
    {
      throw new NotFoundException('Supply not found');
    }

    return {  
      supplyId: supply.supplyId,
      productId: supply.productId,
      supplyName: supply.supplyName,
      category: supply.category,
      sellingPrice: supply.sellingPrice,
      quantity: supply.quantity,
      inStock: supply.quantity > 0,
      storeListed: supply.storeListed,
    };
  }

  // async getStoreHome(): Promise<StoreHomeDto>
  //   {
  //     const queryBuilder = this.supplyRepo
  //       .createQueryBuilder('supply')
  //       .where("supply.isActive = :active", { active: true })
  //       .andWhere("supply.status = :status", { status: SupplyStatusEnum.AVAILABLE })
  //       .andWhere("supply.quantity > 0");
    
  //     const totalProducts = await queryBuilder.getCount();
  
  //     const categories = await this.supplyRepo
  //       .createQueryBuilder('supply')
  //       .select('DISTINCT supply.category', 'category')
  //       .where("supply.isActive = :active", { active: true })
  //       .andWhere("supply.status = :status", { status: SupplyStatusEnum.AVAILABLE })
  //       .andWhere("supply.quantity > 0")
  //       .getRawMany();

  //     const featuredProducts = await this.supplyRepo
  //       .createQueryBuilder('supply')
  //       .where("supply.isActive = :active", { active: true })
  //       .andWhere("supply.status = :status", { status: SupplyStatusEnum.AVAILABLE })
  //       .andWhere("supply.quantity > 0")
  //       .orderBy("supply.lastUpdated", "DESC")
  //       .take(6)
  //       .getMany();
  //     return {
  //       totalProducts,
  //       categories: categories.map(c => c.category),
  //       featuredProducts: featuredProducts.map(supply => ({
  //         supplyId: supply.supplyId,
  //         supplyName: supply.supplyName,
  //         category: supply.category,
  //         sellingPrice: supply.sellingPrice,
  //         inStock: supply.quantity > 0,
  //       })),
  //     }
    // }
}
