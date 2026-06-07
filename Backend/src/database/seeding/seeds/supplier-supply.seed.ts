import { DataSource } from 'typeorm';
import { Supplier } from '../../entities/supplier.entity';
import { Supply } from '../../entities/supply.entity';
import { SupplierSupply } from '../../entities/supplier-supply.entity';

export async function seedSupplierSupplies(
  dataSource: DataSource,
): Promise<void> {
  const supplierRepo = dataSource.getRepository(Supplier);
  const supplyRepo = dataSource.getRepository(Supply);
  const repo = dataSource.getRepository(SupplierSupply);

  const suppliers = await supplierRepo.find();
  const supplies = await supplyRepo.find();

  if (suppliers.length === 0 || supplies.length === 0) {
    console.log('Skipping SupplierSupplies seed: missing data');
    return;
  }

  const supplierFood = suppliers.find(
    (s) => s.supplierName === 'Pet Food Company',
  );
  const supplierMedical = suppliers.find(
    (s) => s.supplierName === 'Vet Medical Supply',
  );
  const supplierAccessories = suppliers.find(
    (s) => s.supplierName === 'Pet Accessories Ltd',
  );

  const dogFood = supplies.find((s) => s.supplyName === 'Dog Food');
  const catFood = supplies.find((s) => s.supplyName === 'Cat Food');
  const rabies = supplies.find((s) => s.supplyName === 'Rabies Vaccine');
  const shampoo = supplies.find((s) => s.supplyName === 'Pet Shampoo');
  const rabbitFood = supplies.find((s) => s.supplyName === 'Rabbit Food');

  const relations = [
    {
      supplier: supplierFood,
      supply: dogFood,
      supplyPrice: '9.50',
    },
    {
      supplier: supplierFood,
      supply: catFood,
      supplyPrice: '7.50',
    },
    {
      supplier: supplierMedical,
      supply: rabies,
      supplyPrice: '22.00',
    },
    {
      supplier: supplierAccessories,
      supply: shampoo,
      supplyPrice: '10.00',
    },
    {
      supplier: supplierAccessories,
      supply: rabbitFood,
      supplyPrice: '5.50',
    },
  ];

  for (const relation of relations) {
    if (!relation.supplier || !relation.supply) continue;

    const exists = await repo.findOne({
      where: {
        supplierId: relation.supplier.supplierId,
        supplyId: relation.supply.supplyId,
      },
    });

    if (!exists) {
      await repo.save(
        repo.create({
          supplier: relation.supplier,
          supply: relation.supply,
          supplyPrice: relation.supplyPrice,
          deliveryTime: '3 days',
          minimumOrderQuantity: 5,
        }),
      );
    }
  }

  console.log('Supplier Supplies seeded');
}