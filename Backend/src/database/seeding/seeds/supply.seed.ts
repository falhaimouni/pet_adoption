import { DataSource } from 'typeorm';
import { Supplier } from '../../entities/supplier.entity';
import { Supply } from '../../entities/supply.entity';
import { Product } from '../../entities/product.entity';
import { SupplyStatusEnum } from '@shared/enums';
import { SUPPLY_CATEGORIES } from '@shared/constants/supply-categories.constants';

export async function seedSupplies(
  dataSource: DataSource,
): Promise<void> {
  const supplyRepo = dataSource.getRepository(Supply);
  const supplierRepo = dataSource.getRepository(Supplier);
  const productRepo = dataSource.getRepository(Product);

  const suppliers = {
    royalCanin: await supplierRepo.findOneByOrFail({
      supplierName: 'Royal Canin Agent',
    }),

    hills: await supplierRepo.findOneByOrFail({
      supplierName: "Hill's Agent",
    }),

    purina: await supplierRepo.findOneByOrFail({
      supplierName: 'Purina Agent',
    }),

    virbac: await supplierRepo.findOneByOrFail({
      supplierName: 'Virbac Agent',
    }),

    beaphar: await supplierRepo.findOneByOrFail({
      supplierName: 'Beaphar Agent',
    }),
  };

  const supplies = [
    {
      supplyName: 'Adult Dog Food',
      category: SUPPLY_CATEGORIES.FOOD,
      quantity: 120,
      sellingPrice: '12.50',
      purchasePrice: '8.00',
      lowStockLimit: 20,
      supplierId: suppliers.royalCanin.supplierId,
      deliveryTimeDays: 3,
      minimumOrderQuantity: 10,
      status: SupplyStatusEnum.AVAILABLE,
    },

    {
      supplyName: 'Puppy Food',
      category: SUPPLY_CATEGORIES.FOOD,
      quantity: 50,
      sellingPrice: '14.00',
      purchasePrice: '9.00',
      lowStockLimit: 15,
      supplierId: suppliers.royalCanin.supplierId,
      deliveryTimeDays: 3,
      minimumOrderQuantity: 10,
      status: SupplyStatusEnum.AVAILABLE,
    },

    {
      supplyName: 'Adult Cat Food',
      category: SUPPLY_CATEGORIES.FOOD,
      quantity: 70,
      sellingPrice: '11.50',
      purchasePrice: '7.00',
      lowStockLimit: 15,
      supplierId: suppliers.hills.supplierId,
      deliveryTimeDays: 4,
      minimumOrderQuantity: 8,
      status: SupplyStatusEnum.AVAILABLE,
    },

    {
      supplyName: 'Kitten Food',
      category: SUPPLY_CATEGORIES.FOOD,
      quantity: 5,
      sellingPrice: '13.00',
      purchasePrice: '8.50',
      lowStockLimit: 10,
      supplierId: suppliers.hills.supplierId,
      deliveryTimeDays: 4,
      minimumOrderQuantity: 8,
      status: SupplyStatusEnum.AVAILABLE,
    },

    {
      supplyName: 'Bird Food',
      category: SUPPLY_CATEGORIES.FOOD,
      quantity: 60,
      sellingPrice: '6.00',
      purchasePrice: '3.80',
      lowStockLimit: 15,
      supplierId: suppliers.purina.supplierId,
      deliveryTimeDays: 5,
      minimumOrderQuantity: 15,
      status: SupplyStatusEnum.AVAILABLE,
    },

    {
      supplyName: 'Rabbit Food',
      category: SUPPLY_CATEGORIES.FOOD,
      quantity: 40,
      sellingPrice: '7.50',
      purchasePrice: '5.00',
      lowStockLimit: 10,
      supplierId: suppliers.purina.supplierId,
      deliveryTimeDays: 5,
      minimumOrderQuantity: 15,
      status: SupplyStatusEnum.AVAILABLE,
    },

    {
      supplyName: 'Rabies Vaccine',
      category: SUPPLY_CATEGORIES.MEDICAL,
      quantity: 30,
      sellingPrice: '28.00',
      purchasePrice: '20.00',
      lowStockLimit: 10,
      supplierId: suppliers.virbac.supplierId,
      deliveryTimeDays: 2,
      minimumOrderQuantity: 5,
      status: SupplyStatusEnum.AVAILABLE,
    },

    {
      supplyName: 'Deworming Tablets',
      category: SUPPLY_CATEGORIES.MEDICAL,
      quantity: 90,
      sellingPrice: '18.00',
      purchasePrice: '12.00',
      lowStockLimit: 20,
      supplierId: suppliers.virbac.supplierId,
      deliveryTimeDays: 2,
      minimumOrderQuantity: 10,
      status: SupplyStatusEnum.AVAILABLE,
    },

    {
      supplyName: 'Pet Shampoo',
      category: SUPPLY_CATEGORIES.CLEANING,
      quantity: 45,
      sellingPrice: '10.00',
      purchasePrice: '6.00',
      lowStockLimit: 10,
      supplierId: suppliers.beaphar.supplierId,
      deliveryTimeDays: 6,
      minimumOrderQuantity: 12,
      status: SupplyStatusEnum.AVAILABLE,
    },

    {
      supplyName: 'Ear Cleaner',
      category: SUPPLY_CATEGORIES.CLEANING,
      quantity: 3,
      sellingPrice: '9.00',
      purchasePrice: '5.00',
      lowStockLimit: 8,
      supplierId: suppliers.beaphar.supplierId,
      deliveryTimeDays: 6,
      minimumOrderQuantity: 12,
      status: SupplyStatusEnum.AVAILABLE,
    },

    {
      supplyName: 'Expired Dog Food',
      category: SUPPLY_CATEGORIES.FOOD,
      quantity: 15,
      sellingPrice: '11.00',
      purchasePrice: '7.00',
      lowStockLimit: 5,
      supplierId: suppliers.royalCanin.supplierId,
      deliveryTimeDays: 3,
      minimumOrderQuantity: 10,
      status: SupplyStatusEnum.EXPIRED,
    },

    {
      supplyName: 'Damaged Cat Food',
      category: SUPPLY_CATEGORIES.FOOD,
      quantity: 8,
      sellingPrice: '12.00',
      purchasePrice: '8.00',
      lowStockLimit: 5,
      supplierId: suppliers.hills.supplierId,
      deliveryTimeDays: 4,
      minimumOrderQuantity: 8,
      status: SupplyStatusEnum.DAMAGED,
    },

    {
      supplyName: 'Old Vaccine',
      category: SUPPLY_CATEGORIES.MEDICAL,
      quantity: 0,
      sellingPrice: '30.00',
      purchasePrice: '22.00',
      lowStockLimit: 5,
      supplierId: suppliers.virbac.supplierId,
      deliveryTimeDays: 2,
      minimumOrderQuantity: 5,
      status: SupplyStatusEnum.DISCONTINUED,
    },
  ];

  for (const supply of supplies) {
    let product = await productRepo.findOne({
      where: {
        productName: supply.supplyName,
        unitPrice: supply.sellingPrice,
        isActive:
          supply.status === SupplyStatusEnum.AVAILABLE && supply.quantity > 0,
      },
    });

    if (!product) {
      product = await productRepo.save(
        productRepo.create({
          productName: supply.supplyName,
          unitPrice: supply.sellingPrice,
          isActive:
            supply.status === SupplyStatusEnum.AVAILABLE && supply.quantity > 0,
        }),
      );
    }

    const exists = await supplyRepo.findOneBy({
      supplyName: supply.supplyName,
      supplierId: supply.supplierId,
      isActive: true,
    });

    if (exists) {
      supplyRepo.merge(exists, supply);
      exists.productId = product.productId;
      await supplyRepo.save(exists);
    } else {
      await supplyRepo.save(
        supplyRepo.create({
          ...supply,
          productId: product.productId,
          isActive: true,
        }),
      );
    }
  }

  console.log('Supplies seeded');
}
