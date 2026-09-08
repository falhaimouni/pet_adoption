import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Cart } from '../../database/entities/cart.entity';
import { CartItem } from '../../database/entities/cart-item.entity';
import { Order } from '../../database/entities/order.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Product } from '../../database/entities/product.entity';
import { User } from '../../database/entities/user.entity';

import { PaymentModule } from '../payments/payments.module';

import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cart,
      CartItem,
      Product,
      Order,
      OrderItem,
      Payment,
      User,
    ]),

    PaymentModule,
  ],

  controllers: [
    CheckoutController,
  ],

  providers: [
    CheckoutService,
  ],
})
export class CheckoutModule {}