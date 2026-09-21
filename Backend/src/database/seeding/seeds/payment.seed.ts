import { DataSource } from 'typeorm';

import { PaymentMethodEnum } from '@shared/enums/payment-method.enum';
import { PaymentStatusEnum } from '@shared/enums/payment-status.enum';
import { Order } from '../../entities/order.entity';
import { Payment } from '../../entities/payment.entity';

export async function seedPayments(
  dataSource: DataSource,
): Promise<void> {
  const orderRepo = dataSource.getRepository(Order);
  const repo = dataSource.getRepository(Payment);

  const payments = [
    {
      paymentId: '550e8400-e29b-41d4-a716-446655442200',
      orderId: '550e8400-e29b-41d4-a716-446655442100',
      amount: '32.00',
      paymentMethod: PaymentMethodEnum.CASH,
      paymentStatus: PaymentStatusEnum.PAID,
      paidAt: new Date('2026-01-15T10:00:00.000Z'),
    },
    {
      paymentId: '550e8400-e29b-41d4-a716-446655442201',
      orderId: '550e8400-e29b-41d4-a716-446655442101',
      amount: '38.00',
      paymentMethod: PaymentMethodEnum.CASH,
      paymentStatus: PaymentStatusEnum.PAID,
      paidAt: new Date('2026-01-16T10:00:00.000Z'),
    },
  ];

  for (const payment of payments) {
    const order = await orderRepo.findOne({
      where: { orderId: payment.orderId },
    });

    if (!order) continue;

    const exists = await repo.findOne({
      where: { paymentId: payment.paymentId },
    });

    const paymentData = {
      paymentId: payment.paymentId,
      orderId: order.orderId,
      order,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      paidAt: payment.paidAt,
    };

    if (exists) {
      await repo.save(repo.merge(exists, paymentData));
    } else {
      await repo.save(repo.create(paymentData));
    }
  }

  console.log('Payments seeded');
}