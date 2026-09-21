import { DataSource } from 'typeorm';
import { Supplier } from '../../entities/supplier.entity';

export async function seedSuppliers(
  dataSource: DataSource,
): Promise<void> {
  const repo = dataSource.getRepository(Supplier);

  const suppliers = [
    {
      supplierName: 'Royal Canin Agent',
      phone: '0791111111',
      email: 'royalcanin@agent.com',
      city: 'Amman',
      country: 'Jordan',
    },
    {
      supplierName: "Hill's Agent",
      phone: '0792222222',
      email: 'hills@agent.com',
      city: 'Amman',
      country: 'Jordan',
    },
    {
      supplierName: 'Purina Agent',
      phone: '0793333333',
      email: 'purina@agent.com',
      city: 'Zarqa',
      country: 'Jordan',
    },
    {
      supplierName: 'Virbac Agent',
      phone: '0794444444',
      email: 'virbac@agent.com',
      city: 'Irbid',
      country: 'Jordan',
    },
    {
      supplierName: 'Beaphar Agent',
      phone: '0795555555',
      email: 'beaphar@agent.com',
      city: 'Aqaba',
      country: 'Jordan',
    },
  ];

  for (const supplier of suppliers) {
    const exists = await repo.findOneBy({
      supplierName: supplier.supplierName,
    });

    if (exists) {
      repo.merge(exists, supplier);
      await repo.save(exists);
    } else {
      await repo.save(repo.create(supplier));
    }
  }

  console.log('Suppliers seeded');
}