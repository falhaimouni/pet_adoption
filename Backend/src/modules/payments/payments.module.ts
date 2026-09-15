import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Cart } from '../../database/entities/cart.entity';
import { CartItem } from '../../database/entities/cart-item.entity';
import { Order } from '../../database/entities/order.entity';
import { Payment } from '../../database/entities/payment.entity';
import { ActivityLog } from '../../database/entities/activity-log.entity';

import { PaymentController } from './payments.controller';
import { PaymentService } from './payments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cart,
      CartItem,
      Order,
      Payment,
      ActivityLog,
    ]),
  ],
  controllers: [
    PaymentController,
  ],
  providers: [
    PaymentService,
  ],
  exports: [
    PaymentService,
  ],
})
export class PaymentModule {}