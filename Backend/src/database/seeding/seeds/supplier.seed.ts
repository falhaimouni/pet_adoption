import { DataSource } from 'typeorm';
import { Supplier } from '../../entities/supplier.entity';

export async function seedSuppliers(
  dataSource: DataSource,
): Promise<void> {
  const repo = dataSource.getRepository(Supplier);

  const suppliers = [
    {
      supplierName: 'Pet Food Company',
      phone: '0791111111',
      email: 'food@supplier.com',
      city: 'Amman',
      country: 'Jordan',
    },
    {
      supplierName: 'Vet Medical Supply',
      phone: '0792222222',
      email: 'medical@supplier.com',
      city: 'Amman',
      country: 'Jordan',
    },
    {
      supplierName: 'Pet Accessories Ltd',
      phone: '0793333333',
      email: 'accessories@supplier.com',
      city: 'Zarqa',
      country: 'Jordan',
    },
  ];

  for (const supplier of suppliers) {
    const exists = await repo.findOne({
      where: {
        supplierName: supplier.supplierName,
      },
    });

    if (exists) {
      await repo.save(repo.merge(exists, supplier));
    } else {
      await repo.save(repo.create(supplier));
    }
  }

  console.log('Suppliers seeded');
}
