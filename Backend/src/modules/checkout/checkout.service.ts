import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DataSource } from 'typeorm';

import { Cart } from '../../database/entities/cart.entity';
import { Order } from '../../database/entities/order.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { Payment } from '../../database/entities/payment.entity';
import { User } from '../../database/entities/user.entity';

import { CreateOrderDto } from '@shared/dto/order.dto';
import { PaymentStatusEnum } from '@shared/enums/payment-status.enum';
import { OrderStatusEnum } from '@shared/enums/order-status.enum';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  async checkout(
    userId: string,
    dto: CreateOrderDto,
  ) {
    const order = await this.dataSource.transaction(async (manager) => {

       //lock the user (if the user sent more than one request at the same time).

      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        //lock the user row for update to prevent race conditions
        .setLock('pessimistic_write')
        .where('user.userId = :userId', { userId })
        //run the query and get the result
        .getOne();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Lock only the cart row. PostgreSQL does not allow a pessimistic lock
      // over the nullable rows produced by LEFT JOINs.
      const lockedCart = await manager
        .getRepository(Cart)
        .createQueryBuilder('cart')
        .setLock('pessimistic_write')
        .where('cart.userId = :userId', { userId })
        .getOne();

      if (!lockedCart) {
        throw new NotFoundException('Cart not found');
      }

      const cart = await manager.getRepository(Cart).findOne({
        where: { cartId: lockedCart.cartId },
        relations: ['cartItems', 'cartItems.product'],
      });

      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

       //make sure the cart contains items.

      if (!cart.cartItems || cart.cartItems.length === 0) {
        throw new BadRequestException(
          'Cannot checkout with an empty cart',
        );
      }

      //validate products and calculate the total from db

      let total = 0;

      for (const cartItem of cart.cartItems) {
        const product = cartItem.product;

        if (!product) {
          throw new BadRequestException(
            'A product in the cart no longer exists',
          );
        }

        if (!product.isActive) {
          throw new BadRequestException(
            `Product "${product.productName}" is no longer available`,
          );
        }

        const unitPrice = Number(product.unitPrice);

        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          throw new BadRequestException(
            `Invalid price for product "${product.productName}"`,
          );
        }

        if (!Number.isInteger(cartItem.quantity) || cartItem.quantity < 1) {
          throw new BadRequestException(
            `Invalid quantity for product "${product.productName}"`,
          );
        }

        total += unitPrice * cartItem.quantity;
      }

       //round to two decimal places before storing the value.

      total = Number(total.toFixed(2));

      //create order

      const orderRepo = manager.getRepository(Order);

      const order = orderRepo.create({
        userId,
        recipientName: dto.recipientName,
        phoneNumber: dto.phoneNumber,
        addressLine: dto.addressLine,
        city: dto.city,
        postalCode: dto.postalCode ?? null,
        deliveryNotes: dto.deliveryNotes ?? null,
        totalPrice: total.toFixed(2),
        orderStatus: OrderStatusEnum.PENDING,
      });

      const savedOrder = await orderRepo.save(order);

      // create OrderItems.
      // we take the current Product price and save it as a snapshot in the OrderItem.

      const orderItemRepo = manager.getRepository(OrderItem);

      const orderItems: OrderItem[] = [];

      for (const cartItem of cart.cartItems) {
        const product = cartItem.product;

        const unitPrice = Number(product.unitPrice);
        const subtotal = unitPrice * cartItem.quantity;

        const orderItem = orderItemRepo.create({
          orderId: savedOrder.orderId,
          productId: product.productId,
          quantity: cartItem.quantity,
          unitPrice: unitPrice.toFixed(2),
          subtotal: subtotal.toFixed(2),
        });

        orderItems.push(orderItem);
      }

      await orderItemRepo.save(orderItems);

      // create the payment.
      // The frontend only selected the payment method

      const paymentRepo = manager.getRepository(Payment);

      const payment = paymentRepo.create({
        orderId: savedOrder.orderId,
        amount: total.toFixed(2),
        paymentMethod: dto.paymentMethod,
        paymentStatus: PaymentStatusEnum.PENDING,
        transactionId: null,
        paidAt: null,
      });

      await paymentRepo.save(payment);

      // return order with payment information

      return manager
        .getRepository(Order)
        .findOne({
          where: {
            orderId: savedOrder.orderId,
          },
          relations: [
            'orderItems',
            'orderItems.product',
            'payments',
          ],
        });
    });

    if (!order) {
      throw new NotFoundException('Order could not be created');
    }

    return order;
  }

  async cancelOrder(userId: string, orderId: string) {
    await this.dataSource.transaction(async (manager) => {
      const order = await manager
        .getRepository(Order)
        .createQueryBuilder('order')
        .setLock('pessimistic_write')
        .where('order.orderId = :orderId', { orderId })
        .andWhere('order.userId = :userId', { userId })
        .getOne();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.orderStatus !== OrderStatusEnum.PENDING) {
        throw new BadRequestException(
          'Only unpaid pending orders can be canceled',
        );
      }

      const payment = await manager.getRepository(Payment).findOne({
        where: {
          orderId,
          paymentStatus: PaymentStatusEnum.PENDING,
        },
      });

      if (!payment) {
        throw new BadRequestException(
          'Only orders with a pending payment can be canceled',
        );
      }

      order.orderStatus = OrderStatusEnum.CANCELED;
      await manager.getRepository(Order).save(order);

      payment.paymentStatus = PaymentStatusEnum.FAILED;
      await manager.getRepository(Payment).save(payment);
    });

    return {
      orderId,
      orderStatus: OrderStatusEnum.CANCELED,
      cartPreserved: true,
      redirectTo: '/cart',
    };
  }
}