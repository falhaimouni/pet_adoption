import { DataSource } from 'typeorm';

import { OrderStatusEnum } from '@shared/enums/order-status.enum';
import { Order } from '../../entities/order.entity';
import { User } from '../../entities/user.entity';

export async function seedOrders(
  dataSource: DataSource,
): Promise<void> {
  const orderRepo = dataSource.getRepository(Order);
  const userRepo = dataSource.getRepository(User);

  const orders = [
    {
      orderId: '550e8400-e29b-41d4-a716-446655442100',
      userEmail: 'adopter1@test.com',
      recipientName: 'Joud Khaled',
      phoneNumber: '0799000001',
      addressLine: 'Amman, Abdoun Street 12',
      city: 'Amman',
      postalCode: '11118',
      deliveryNotes: 'Leave at the front desk',
      orderStatus: OrderStatusEnum.COMPLETED,
      totalPrice: '32.00',
    },
    {
      orderId: '550e8400-e29b-41d4-a716-446655442101',
      userEmail: 'adopter2@test.com',
      recipientName: 'Maya Hassan',
      phoneNumber: '0799000002',
      addressLine: 'Zarqa, University Street 5',
      city: 'Zarqa',
      postalCode: null,
      deliveryNotes: null,
      orderStatus: OrderStatusEnum.PENDING,
      totalPrice: '38.00',
    },
  ];

  for (const order of orders) {
    const user = await userRepo.findOne({
      where: { email: order.userEmail },
    });

    if (!user) continue;

    const exists = await orderRepo.findOne({
      where: { orderId: order.orderId },
    });

    const orderData = {
      orderId: order.orderId,
      userId: user.userId,
      user,
      recipientName: order.recipientName,
      phoneNumber: order.phoneNumber,
      addressLine: order.addressLine,
      city: order.city,
      postalCode: order.postalCode,
      deliveryNotes: order.deliveryNotes,
      totalPrice: order.totalPrice,
      orderStatus: order.orderStatus,
    };

    if (exists) {
      await orderRepo.save(orderRepo.merge(exists, orderData));
    } else {
      await orderRepo.save(orderRepo.create(orderData));
    }
  }

  console.log('Orders seeded');
}