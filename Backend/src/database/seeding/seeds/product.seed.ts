import { DataSource } from 'typeorm';

import { Product } from '../../entities/product.entity';

export async function seedProducts(
  dataSource: DataSource,
): Promise<void> {
  const repo = dataSource.getRepository(Product);

  const products = [
    {
      productId: '550e8400-e29b-41d4-a716-446655441000',
      productName: 'Dog Food',
      unitPrice: '10.00',
      isActive: true,
    },
    {
      productId: '550e8400-e29b-41d4-a716-446655441001',
      productName: 'Cat Food',
      unitPrice: '8.00',
      isActive: true,
    },
    {
      productId: '550e8400-e29b-41d4-a716-446655441002',
      productName: 'Pet Shampoo',
      unitPrice: '12.00',
      isActive: true,
    },
    {
      productId: '550e8400-e29b-41d4-a716-446655441003',
      productName: 'Rabbit Food',
      unitPrice: '6.00',
      isActive: true,
    },
    {
      productId: '550e8400-e29b-41d4-a716-446655441004',
      productName: 'Pet Leash',
      unitPrice: '15.00',
      isActive: true,
    },
  ];

  for (const product of products) {
    const exists = await repo.findOne({
      where: { productId: product.productId },
    });

    if (exists) {
      await repo.save(repo.merge(exists, product));
    } else {
      await repo.save(repo.create(product));
    }
  }

  console.log('Products seeded');
}