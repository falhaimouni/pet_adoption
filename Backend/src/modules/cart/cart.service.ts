import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Cart } from '../../database/entities/cart.entity';
import { CartItem } from '../../database/entities/cart-item.entity';
import { Product } from '../../database/entities/product.entity';
import { User } from '../../database/entities/user.entity';
import { AddCartItemDto } from './cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,

    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly dataSource: DataSource,
  ) {}

  async getMyCart(userId: string) {
    const cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['cartItems', 'cartItems.product'],
    });

    if (!cart) {
      return this.createEmptyCart(userId);
    }

    return cart;
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.userId = :userId', { userId })
        .getOne();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const product = await manager.getRepository(Product).findOne({
        where: { productId: dto.productId, isActive: true },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const cartRepo = manager.getRepository(Cart);
      const cartItemRepo = manager.getRepository(CartItem);

      let cart = await cartRepo
        .createQueryBuilder('cart')
        .setLock('pessimistic_write')
        .where('cart.userId = :userId', { userId })
        .getOne();

      if (!cart) {
        cart = cartRepo.create({ userId });
        cart = await cartRepo.save(cart);
      }

      const existingItem = await cartItemRepo
        .createQueryBuilder('cartItem')
        .setLock('pessimistic_write')
        .where('cartItem.cartId = :cartId', { cartId: cart.cartId })
        .andWhere('cartItem.productId = :productId', {
          productId: product.productId,
        })
        .getOne();

      const unitPrice = Number(product.unitPrice);
      const quantityToAdd = dto.quantity;

      if (existingItem) {
        const updatedQuantity = existingItem.quantity + quantityToAdd;
        existingItem.quantity = updatedQuantity;
        existingItem.unitPrice = unitPrice.toFixed(2);
        existingItem.subtotal = (unitPrice * updatedQuantity).toFixed(2);
        await cartItemRepo.save(existingItem);
      } else {
        const cartItem = cartItemRepo.create({
          cartId: cart.cartId,
          productId: product.productId,
          quantity: quantityToAdd,
          unitPrice: unitPrice.toFixed(2),
          subtotal: (unitPrice * quantityToAdd).toFixed(2),
        });

        await cartItemRepo.save(cartItem);
      }

      return cartRepo.findOne({
        where: { cartId: cart.cartId },
        relations: ['cartItems', 'cartItems.product'],
      });
    });
  }

  private async createEmptyCart(userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.userId = :userId', { userId })
        .getOne();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const cartRepo = manager.getRepository(Cart);
      let cart = await cartRepo.findOne({ where: { userId } });
      if (!cart) {
        cart = await cartRepo.save(cartRepo.create({ userId }));
      }

      return cartRepo.findOne({
        where: { cartId: cart.cartId },
        relations: ['cartItems', 'cartItems.product'],
      });
    });
  }

  async removeItem(userId: string, productId: string) {
    await this.dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(User)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.userId = :userId', { userId })
        .getOne();
      if (!user) throw new NotFoundException('User not found');

      const cart = await manager.getRepository(Cart)
        .createQueryBuilder('cart')
        .setLock('pessimistic_write')
        .where('cart.userId = :userId', { userId })
        .getOne();
      if (!cart) throw new NotFoundException('Cart not found');

      const result = await manager.getRepository(CartItem).delete({
        cartId: cart.cartId,
        productId,
      });
      if (!result.affected) throw new NotFoundException('Cart item not found');
    });

    return this.getMyCart(userId);
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(User)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.userId = :userId', { userId })
        .getOne();
      if (!user) throw new NotFoundException('User not found');

      const cart = await manager.getRepository(Cart)
        .createQueryBuilder('cart')
        .setLock('pessimistic_write')
        .where('cart.userId = :userId', { userId })
        .getOne();
      if (!cart) throw new NotFoundException('Cart not found');

      const cartItemRepo = manager.getRepository(CartItem);
      const cartItem = await cartItemRepo
        .createQueryBuilder('cartItem')
        .setLock('pessimistic_write')
        .innerJoinAndSelect('cartItem.product', 'product')
        .where('cartItem.cartId = :cartId', { cartId: cart.cartId })
        .andWhere('cartItem.productId = :productId', { productId })
        .getOne();
      if (!cartItem) throw new NotFoundException('Cart item not found');

      const unitPrice = Number(cartItem.product?.unitPrice ?? cartItem.unitPrice);
      cartItem.quantity = quantity;
      cartItem.unitPrice = unitPrice.toFixed(2);
      cartItem.subtotal = (unitPrice * quantity).toFixed(2);
      await cartItemRepo.save(cartItem);

      return manager.getRepository(Cart).findOne({
        where: { cartId: cart.cartId },
        relations: ['cartItems', 'cartItems.product'],
      });
    });
  }

  async clearCart(userId: string) {
    await this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.userId = :userId', { userId })
        .getOne();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const cart = await manager
        .getRepository(Cart)
        .createQueryBuilder('cart')
        .setLock('pessimistic_write')
        .where('cart.userId = :userId', { userId })
        .getOne();

      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      await manager.getRepository(CartItem).delete({ cartId: cart.cartId });
      await manager.getRepository(Cart).delete({ cartId: cart.cartId });
    });

    return { success: true, message: 'Cart deleted successfully' };
  }
}
