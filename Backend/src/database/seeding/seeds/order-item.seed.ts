import { DataSource } from 'typeorm';

import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Product } from '../../entities/product.entity';

export async function seedOrderItems(
  dataSource: DataSource,
): Promise<void> {
  const orderRepo = dataSource.getRepository(Order);
  const productRepo = dataSource.getRepository(Product);
  const repo = dataSource.getRepository(OrderItem);

  const items = [
    {
      orderId: '550e8400-e29b-41d4-a716-446655442100',
      productName: 'Dog Food',
      quantity: 2,
    },
    {
      orderId: '550e8400-e29b-41d4-a716-446655442100',
      productName: 'Pet Shampoo',
      quantity: 1,
    },
    {
      orderId: '550e8400-e29b-41d4-a716-446655442101',
      productName: 'Cat Food',
      quantity: 1,
    },
    {
      orderId: '550e8400-e29b-41d4-a716-446655442101',
      productName: 'Pet Leash',
      quantity: 2,
    },
  ];

  for (const item of items) {
    const order = await orderRepo.findOne({
      where: { orderId: item.orderId },
    });

    const product = await productRepo.findOne({
      where: { productName: item.productName },
    });

    if (!order || !product) continue;

    const unitPrice = Number(product.unitPrice);
    const subtotal = unitPrice * item.quantity;

    const exists = await repo.findOne({
      where: {
        orderId: order.orderId,
        productId: product.productId,
      },
    });

    const orderItemData = {
      orderId: order.orderId,
      productId: product.productId,
      quantity: item.quantity,
      unitPrice: unitPrice.toFixed(2),
      subtotal: subtotal.toFixed(2),
    };

    if (exists) {
      await repo.save(repo.merge(exists, orderItemData));
    } else {
      await repo.save(repo.create(orderItemData));
    }
  }

  console.log('Order items seeded');
}