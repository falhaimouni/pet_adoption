import { DataSource } from 'typeorm';
import { Supply } from '../../entities/supply.entity';

export async function seedSupplies(
  dataSource: DataSource,
): Promise<void> {
  const repo = dataSource.getRepository(Supply);

  const supplies = [
    {
      supplyName: 'Dog Food',
      category: 'Food',
      quantity: 100,
      unitPrice: '10.00',
      lowStockLimit: 20,
    },
    {
      supplyName: 'Cat Food',
      category: 'Food',
      quantity: 80,
      unitPrice: '8.00',
      lowStockLimit: 15,
    },
    {
      supplyName: 'Rabies Vaccine',
      category: 'Medical',
      quantity: 50,
      unitPrice: '25.00',
      lowStockLimit: 10,
    },
    {
      supplyName: 'Pet Shampoo',
      category: 'Care',
      quantity: 30,
      unitPrice: '12.00',
      lowStockLimit: 5,
    },
    {
      supplyName: 'Rabbit Food',
      category: 'Food',
      quantity: 40,
      unitPrice: '6.00',
      lowStockLimit: 10,
    },
  ];

  for (const supply of supplies) {
    const exists = await repo.findOne({
      where: {
        supplyName: supply.supplyName,
        category: supply.category,
      },
    });

    if (!exists) {
      await repo.save(repo.create(supply));
    }
  }

  console.log('Supplies seeded');
}