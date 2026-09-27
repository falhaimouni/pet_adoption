import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { DataSource, EntityManager } from 'typeorm';

import { Cart } from '../../database/entities/cart.entity';
import { CartItem } from '../../database/entities/cart-item.entity';
import { Order } from '../../database/entities/order.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Product } from '../../database/entities/product.entity';
import { Supply } from '../../database/entities/supply.entity';
import { User } from '../../database/entities/user.entity';
import { ActivityLog } from '../../database/entities/activity-log.entity';

import { CreateOrderDto } from '@shared/dto/order.dto';
import { PaymentMethodEnum } from '@shared/enums/payment-method.enum';
import { PaymentStatusEnum } from '@shared/enums/payment-status.enum';
import { OrderStatusEnum } from '@shared/enums/order-status.enum';
import { SupplyStatusEnum } from '@shared/enums/supply-status.enum';
import { NotificationTypeEnum, RolesEnum } from '@shared/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { listedStoreSupplyForProduct } from '../store/store-availability';

type InventoryAlert = {
  title: string;
  message: string;
};

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  private readonly orderRelations = [
    'orderItems',
    'orderItems.product',
    'orderItems.product.supplies',
    'orderItems.product.supplies.imageFile',
    'payments',
  ];

  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
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
        relations: ['cartItems', 'cartItems.product', 'cartItems.product.supplies'],
      });

      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      // Legacy/unlisted items are hidden by the cart API. Do not include those
      // invisible rows in the order or let them block the visible cart.
      cart.cartItems = (cart.cartItems ?? []).filter((item) =>
        listedStoreSupplyForProduct(item.product) !== undefined,
      );

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

        await this.validateAvailableStock(
          manager,
          product.productId,
          product.productName,
          cartItem.quantity,
        );

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

      await manager.getRepository(ActivityLog).save(
        manager.getRepository(ActivityLog).create({
          userId,
          action: 'ORDER_CREATED',
          entityType: 'ORDER',
          entityId: savedOrder.orderId,
        }),
      );

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

      // Return the pending order for the review page. Payment and cart
      // changes happen only after the user explicitly pays.
      return this.findOrder(manager, savedOrder.orderId);
    });

    if (!order) {
      throw new NotFoundException('Order could not be created');
    }
    await this.notificationsService.notifyUsers(
      [userId],
      'Order created',
      `Your order ${order.orderReference} was created.`,
      NotificationTypeEnum.ORDER,
    );
    await this.notificationsService.notifyRoles(
      [RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE],
      'New order',
      `Order ${order.orderReference} was created.`,
      NotificationTypeEnum.ORDER,
    );

    return order;
  }

  async cancel(userId: string, orderId: string) {
    const order = await this.dataSource.transaction(async (manager) => {
      const lockedOrder = await manager
        .getRepository(Order)
        .createQueryBuilder('order')
        .setLock('pessimistic_write')
        .where('order.orderId = :orderId', { orderId })
        .andWhere('order.userId = :userId', { userId })
        .getOne();

      if (!lockedOrder) {
        throw new NotFoundException('Order not found');
      }

      if (lockedOrder.orderStatus !== OrderStatusEnum.PENDING) {
        throw new BadRequestException('Only pending orders can be canceled');
      }

      lockedOrder.orderStatus = OrderStatusEnum.CANCELED;
      await manager.getRepository(Order).save(lockedOrder);

      return this.findOrder(manager, orderId);
    });

    if (!order) {
      throw new NotFoundException('Order could not be canceled');
    }
    await this.notificationsService.notifyUsers(
      [userId],
      'Order cancelled',
      `Your order ${order.orderReference} was cancelled.`,
      NotificationTypeEnum.ORDER,
    );
    await this.notificationsService.notifyRoles(
      [RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE],
      'Order cancelled',
      `Order ${order.orderReference} was cancelled.`,
      NotificationTypeEnum.ORDER,
    );

    return order;
  }

  async pay(userId: string, orderId: string) {
    const { order, alerts } = await this.dataSource.transaction(async (manager) => {
      const lockedOrder = await manager
        .getRepository(Order)
        .createQueryBuilder('order')
        .setLock('pessimistic_write')
        .where('order.orderId = :orderId', { orderId })
        .andWhere('order.userId = :userId', { userId })
        .getOne();

      if (!lockedOrder) {
        throw new NotFoundException('Order not found');
      }

      if (lockedOrder.orderStatus !== OrderStatusEnum.PENDING) {
        throw new BadRequestException('Only pending orders can be paid');
      }

      const existingPayment = await manager.getRepository(Payment).findOne({
        where: { orderId },
      });

      if (existingPayment) {
        throw new BadRequestException('Order already has a payment');
      }

      const orderItems = await manager.getRepository(OrderItem).find({
        where: { orderId },
        relations: ['product'],
      });
      const inventoryAlerts: InventoryAlert[] = [];

      for (const item of orderItems) {
        const productName = item.product?.productName ?? 'Store item';
        const supply = await this.validateAvailableStock(
          manager,
          item.productId,
          productName,
          item.quantity,
          true,
        );

        const wasLowStock = this.isLowStock(supply);
        supply.quantity -= item.quantity;
        if (supply.quantity <= 0) {
          supply.quantity = 0;
          supply.status = SupplyStatusEnum.OUT_OF_STOCK;
        }

        await manager.getRepository(Supply).save(supply);
        await manager.getRepository(Product).update(supply.productId, {
          isActive:
            supply.isActive &&
            supply.storeListed &&
            supply.status === SupplyStatusEnum.AVAILABLE &&
            supply.quantity > 0,
        });

        const isNowLowStock = this.isLowStock(supply);
        if (!wasLowStock && isNowLowStock) {
          inventoryAlerts.push(this.buildInventoryAlert(supply));
        } else if (
          wasLowStock &&
          supply.quantity === 0 &&
          supply.status === SupplyStatusEnum.OUT_OF_STOCK
        ) {
          inventoryAlerts.push(this.buildInventoryAlert(supply));
        }
      }

      await manager.getRepository(Payment).save(
        manager.getRepository(Payment).create({
          orderId,
          amount: lockedOrder.totalPrice,
          paymentMethod: PaymentMethodEnum.CASH,
          paymentStatus: PaymentStatusEnum.PAID,
          paidAt: new Date(),
        }),
      );

      lockedOrder.orderStatus = OrderStatusEnum.COMPLETED;
      await manager.getRepository(Order).save(lockedOrder);

      const cart = await manager.getRepository(Cart).findOne({
        where: { userId },
      });

      if (cart) {
        await manager.getRepository(CartItem).delete({ cartId: cart.cartId });
        await manager.getRepository(Cart).delete({ cartId: cart.cartId });
      }

      return {
        order: await this.findOrder(manager, orderId),
        alerts: inventoryAlerts,
      };
    });

    if (!order) {
      throw new NotFoundException('Order could not be paid');
    }

    try {
      await Promise.all(
        alerts.map((alert) =>
          this.notificationsService.createInventoryAlert(alert.title, alert.message),
        ),
      );
    } catch (error) {
      this.logger.error(
        `Failed to send inventory alert for order ${orderId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
    await this.notificationsService.notifyUsers(
      [userId],
      'Order completed',
      `Your order ${order.orderReference} was completed.`,
      NotificationTypeEnum.ORDER,
    );
    await this.notificationsService.notifyRoles(
      [RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE],
      'Order completed',
      `Order ${order.orderReference} was paid and completed.`,
      NotificationTypeEnum.ORDER,
    );

    return order;
  }

  private async findOrder(manager: EntityManager, orderId: string) {
    const order = await manager.getRepository(Order).findOne({
      where: { orderId },
      relations: this.orderRelations,
    });

    if (order) {
      for (const item of order.orderItems ?? []) {
        const imageFile = item.product?.supplies?.[0]?.imageFile;
        item.imageUrl = imageFile
          ? /^https?:\/\//i.test(imageFile.fileUrl)
            ? imageFile.fileUrl
            : `/files/${imageFile.fileId}`
          : null;
      }
    }

    return order;
  }

  private async validateAvailableStock(
    manager: EntityManager,
    productId: string,
    productName: string,
    quantity: number,
    lock = false,
  ) {
    let query = manager
      .getRepository(Supply)
      .createQueryBuilder('supply')
      .where('supply.productId = :productId', { productId })
      .andWhere('supply.isActive = :isActive', { isActive: true })
      .andWhere('supply.storeListed = :storeListed', { storeListed: true })
      .andWhere('supply.status = :status', { status: SupplyStatusEnum.AVAILABLE });

    if (lock) {
      query = query.setLock('pessimistic_write');
    }

    const supply = await query.getOne();

    if (!supply || supply.status !== SupplyStatusEnum.AVAILABLE) {
      throw new BadRequestException(
        `Product "${productName}" is no longer available`,
      );
    }

    if (supply.quantity < quantity) {
      throw new BadRequestException(
        `Only ${supply.quantity} item(s) available for "${productName}"`,
      );
    }

    return supply;
  }

  private isLowStock(supply: Supply): boolean {
    return (
      supply.status === SupplyStatusEnum.AVAILABLE ||
      supply.status === SupplyStatusEnum.OUT_OF_STOCK
    ) && supply.quantity <= supply.lowStockLimit;
  }

  private buildInventoryAlert(supply: Supply): InventoryAlert {
    const title =
      supply.quantity <= 0 ? 'Supply out of stock' : 'Supply low stock';
    const message =
      `${supply.supplyName} has quantity ${supply.quantity}. ` +
      `Minimum stock is ${supply.lowStockLimit}.`;

    return { title, message };
  }

}
