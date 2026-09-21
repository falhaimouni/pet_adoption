import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from '../../database/entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async findMine(userId: string) {
    return this.orderRepository.find({
      where: { userId },
      relations: ['orderItems', 'orderItems.product', 'payments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMyOrder(userId: string, orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { userId, orderId },
      relations: ['orderItems', 'orderItems.product', 'payments'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  //bring all orders with their associated user, order items, and payments
  async findAll() {
    const orders = await this.orderRepository.find({
      relations: [
        'user',
        'orderItems',
        'orderItems.product',
        'payments',
      ],
      order: {
        //newest orders first
        createdAt: 'DESC',
      },
    });

    //take the password out of the user object and put everything else in a new object called safeUser
    // the _ means that we are not using the var
    return orders.map((order) => {
      const { password: _password, ...safeUser } = order.user;

      return {
        // ... spread operator copies all properties from the order object into this object
        ...order,
        user: safeUser,
      };
    });
  }
}
