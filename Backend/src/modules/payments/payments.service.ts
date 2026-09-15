import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import Stripe from 'stripe';
import { DataSource, In } from 'typeorm';

import { Cart } from '../../database/entities/cart.entity';
import { CartItem } from '../../database/entities/cart-item.entity';
import { Order } from '../../database/entities/order.entity';
import { Payment } from '../../database/entities/payment.entity';
import { ActivityLog } from '../../database/entities/activity-log.entity';

import { PaymentMethodEnum } from '@shared/enums/payment-method.enum';
import { PaymentStatusEnum } from '@shared/enums/payment-status.enum';
import { OrderStatusEnum } from '@shared/enums/order-status.enum';
import { CURRENCY_CODE } from '@shared/constants/currency.constants';

@Injectable()
export class PaymentService {
  private readonly stripe: Stripe;

  constructor(
    private readonly dataSource: DataSource,
  ) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not configured',
      );
    }

    // initialize the Stripe client with the secret key
    this.stripe = new Stripe(secretKey);
  }

  async createCheckoutSession(
    orderId: string,
    userId: string,
  ) {
    const order = await this.dataSource
      .getRepository(Order)
      .findOne({
        where: {
          orderId,
          userId,
        },
        relations: [
          'orderItems',
          'orderItems.product',
          'payments',
        ],
      });

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    if (order.orderStatus !== OrderStatusEnum.PENDING) {
      throw new BadRequestException(
        'Only unpaid pending orders can be paid',
      );
    }

    const payment = order.payments?.find(
      (item) =>
        item.paymentStatus ===
        PaymentStatusEnum.PENDING,
    );

    if (!payment) {
      throw new BadRequestException(
        'No pending payment found for this order',
      );
    }

    if (payment.transactionId) {
      const existingSession = await this.stripe.checkout.sessions.retrieve(
        payment.transactionId,
      );

      if (existingSession.status === 'open' && existingSession.url) {
        return {
          orderId: order.orderId,
          paymentId: payment.paymentId,
          checkoutUrl: existingSession.url,
        };
      }

      throw new BadRequestException(
        'A payment session already exists for this order',
      );
    }

    if (
      payment.paymentMethod !==
      PaymentMethodEnum.CARD
    ) {
      throw new BadRequestException(
        'Only card payments are supported',
      );
    }

    // all the items in the order to be paid for wiyh their prices and quantities
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      order.orderItems.map((item) => {
        const unitPrice = Number(item.unitPrice);

        if (
          !Number.isFinite(unitPrice) ||
          unitPrice < 0
        ) {
          throw new BadRequestException(
            'Invalid order item price',
          );
        }

        return {
          price_data: {
            currency: CURRENCY_CODE.toLowerCase(),

            product_data: {
              name: item.product.productName,
            },

            unit_amount: Math.round(
              unitPrice * 100,
            ),
          },

          quantity: item.quantity,
        };
      });

      // create a Stripe checkout session for the order
    const session =
      await this.stripe.checkout.sessions.create({
        //one time payment for the order not subscription
        mode: 'payment',

        line_items: lineItems,

        success_url:
          `${process.env.FRONTEND_URL}/payment/success` +
          `?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${process.env.FRONTEND_URL}/payment/cancel`,

        client_reference_id: order.orderId,

        metadata: {
          orderId: order.orderId,
          paymentId: payment.paymentId,
          userId: order.userId,
        },

        payment_method_types: ['card'],
      });

      //the checkout session id
    payment.transactionId = session.id;

    await this.dataSource
      .getRepository(Payment)
      .save(payment);

    return {
      orderId: order.orderId,
      paymentId: payment.paymentId,
      checkoutUrl: session.url,
    };
  }

  async handleWebhook(
    signature: string,
    rawBody: Buffer,
  ) {
    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error(
        'STRIPE_WEBHOOK_SECRET is not configured',
      );
    }

    let event: Stripe.Event;

    try {
      event =
        this.stripe.webhooks.constructEvent(
          rawBody,
          signature,
          webhookSecret,
        );
    } catch {
      throw new BadRequestException(
        'Invalid Stripe webhook signature',
      );
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired':
        await this.handleCheckoutFailed(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
    }

    return {
      received: true,
    };
  }

  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ) {
    const orderId = session.metadata?.orderId;
    const paymentId = session.metadata?.paymentId;

    if (!orderId || !paymentId) {
      throw new BadRequestException(
        'Stripe session is missing payment metadata',
      );
    }

    if (session.payment_status !== 'paid') {
      return;
    }

    await this.dataSource.transaction(
      async (manager) => {
        const paymentRepo =
          manager.getRepository(Payment);

        const orderRepo =
          manager.getRepository(Order);

        const cartRepo =
          manager.getRepository(Cart);

        const cartItemRepo =
          manager.getRepository(CartItem);

        const payment =
          await paymentRepo
            .createQueryBuilder('payment')
            .setLock('pessimistic_write')
            .where('payment.paymentId = :paymentId', { paymentId })
            .andWhere('payment.orderId = :orderId', { orderId })
            .getOne();

        if (!payment) {
          throw new NotFoundException(
            'Payment not found',
          );
        }

        // Stripe may retry webhook delivery.
        // if we already processed this payment do nothing.
        if (
          payment.paymentStatus ===
          PaymentStatusEnum.PAID
        ) {
          return;
        }

        if (payment.paymentStatus !== PaymentStatusEnum.PENDING) {
          return;
        }

        const order =
          await orderRepo.findOne({
            where: {
              orderId,
            },
            relations: ['orderItems'],
          });

        if (!order) {
          throw new NotFoundException(
            'Order not found',
          );
        }

        if (order.orderStatus !== OrderStatusEnum.PENDING) {
          return;
        }

        if (order.orderStatus === OrderStatusEnum.PENDING) {
          order.orderStatus = OrderStatusEnum.COMPLETED;
          await orderRepo.save(order);
        }

        payment.paymentStatus =
          PaymentStatusEnum.PAID;

        payment.paidAt = new Date();

        await paymentRepo.save(payment);

        await manager.getRepository(ActivityLog).save(
          manager.getRepository(ActivityLog).create({
            userId: order.userId,
            action: 'PAYMENT_SUCCEEDED',
            entityType: 'PAYMENT',
            entityId: payment.paymentId,
          }),
        );

        // find the user's cart
        const cart =
          await cartRepo.findOne({
            where: {
              userId: order.userId,
            },
          });

        // clear only the items included in this paid order. Items added to
        // the cart after checkout must remain available.
        if (cart && order.orderItems.length > 0) {
          await cartItemRepo.delete({
            cartId: cart.cartId,
            productId: In(
              order.orderItems.map((orderItem) => orderItem.productId),
            ),
          });
        }
      },
    );
  }

  private async handleCheckoutFailed(
    session: Stripe.Checkout.Session,
  ) {
    const orderId =
      session.metadata?.orderId;
    const paymentId =
      session.metadata?.paymentId;

    if (!orderId || !paymentId) {
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);

      const payment = await paymentRepo
        .createQueryBuilder('payment')
        .setLock('pessimistic_write')
        .where('payment.paymentId = :paymentId', { paymentId })
        .andWhere('payment.orderId = :orderId', { orderId })
        .getOne();

      if (!payment) {
        return;
      }

      // never change an already successful payment back to FAILED
      if (payment.paymentStatus === PaymentStatusEnum.PAID) {
        return;
      }

      if (payment.paymentStatus === PaymentStatusEnum.FAILED) {
        return;
      }

      const order = await manager.getRepository(Order).findOne({
        where: { orderId },
        select: { orderId: true, userId: true },
      });

      if (!order) {
        return;
      }

      payment.paymentStatus = PaymentStatusEnum.FAILED;
      await paymentRepo.save(payment);

      //payment failed order canceled, cart remains
      await manager.getRepository(Order).update(
        { orderId, orderStatus: OrderStatusEnum.PENDING },
        { orderStatus: OrderStatusEnum.CANCELED },
      );

      await manager.getRepository(ActivityLog).save(
        manager.getRepository(ActivityLog).create({
          userId: order.userId,
          action: 'PAYMENT_FAILED',
          entityType: 'PAYMENT',
          entityId: payment.paymentId,
        }),
      );
    });
  }
}