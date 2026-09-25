import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Cart } from '../../database/entities/cart.entity';
import { CartItem } from '../../database/entities/cart-item.entity';
import { Product } from '../../database/entities/product.entity';
import { Supply } from '../../database/entities/supply.entity';
import { User } from '../../database/entities/user.entity';
import { AddCartItemDto } from './cart.dto';
import { SupplyStatusEnum } from '@shared/enums/supply-status.enum';

@Injectable()
export class CartService {
  private readonly cartRelations = [
    'cartItems',
    'cartItems.product',
    'cartItems.product.supplies',
    'cartItems.product.supplies.imageFile',
  ];

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
      relations: this.cartRelations,
    });

    if (!cart) {
      return this.createEmptyCart(userId);
    }

    return this.withSupplyImages(cart);
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
          productId: dto.productId,
        })
        .getOne();

      const quantityToAdd = dto.quantity;
      const requestedQuantity = (existingItem?.quantity ?? 0) + quantityToAdd;
      const supply = await this.findListedStoreSupply(
        manager,
        dto.productId,
        requestedQuantity,
        true,
      );
      const product = supply.product;
      const unitPrice = Number(product.unitPrice);

      if (existingItem) {
        existingItem.quantity = requestedQuantity;
        existingItem.unitPrice = unitPrice.toFixed(2);
        existingItem.subtotal = (unitPrice * requestedQuantity).toFixed(2);
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

      const savedCart = await cartRepo.findOne({
        where: { cartId: cart.cartId },
        relations: this.cartRelations,
      });
      return this.withSupplyImages(savedCart);
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

      const savedCart = await cartRepo.findOne({
        where: { cartId: cart.cartId },
        relations: this.cartRelations,
      });
      return this.withSupplyImages(savedCart);
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

      const supply = await this.findListedStoreSupply(
        manager,
        productId,
        quantity,
        true,
      );
      const unitPrice = Number(cartItem.product?.unitPrice ?? cartItem.unitPrice);
      if (cartItem.product) {
        cartItem.product.unitPrice = supply.product.unitPrice;
      }
      cartItem.quantity = quantity;
      const currentUnitPrice = Number(supply.product.unitPrice ?? unitPrice);
      cartItem.unitPrice = currentUnitPrice.toFixed(2);
      cartItem.subtotal = (currentUnitPrice * quantity).toFixed(2);
      await cartItemRepo.save(cartItem);

      const savedCart = await manager.getRepository(Cart).findOne({
        where: { cartId: cart.cartId },
        relations: this.cartRelations,
      });
      return this.withSupplyImages(savedCart);
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

  private withSupplyImages(cart: Cart | null): Cart | null {
    if (!cart) return cart;

    cart.cartItems = (cart.cartItems ?? []).filter((item) =>
      this.listedStoreSupplyForProduct(item.product) !== undefined,
    );

    for (const item of cart.cartItems ?? []) {
      const imageFile = this.listedStoreSupplyForProduct(item.product)?.imageFile;
      item.imageUrl = imageFile
        ? /^https?:\/\//i.test(imageFile.fileUrl)
          ? imageFile.fileUrl
          : `/files/${imageFile.fileId}`
        : null;
    }

    return cart;
  }

  private listedStoreSupplyForProduct(product?: Product | null): Supply | undefined {
    return product?.supplies?.find((supply) =>
      supply.isActive === true &&
      supply.storeListed === true &&
      supply.status === SupplyStatusEnum.AVAILABLE &&
      Number(supply.quantity ?? 0) > 0,
    );
  }

  private async findListedStoreSupply(
    manager: DataSource['manager'],
    productId: string,
    quantity: number,
    lock = false,
  ): Promise<Supply> {
    let query = manager
      .getRepository(Supply)
      .createQueryBuilder('supply')
      .innerJoinAndSelect('supply.product', 'product')
      .where('supply.productId = :productId', { productId })
      .andWhere('supply.isActive = :isActive', { isActive: true })
      .andWhere('supply.storeListed = :storeListed', { storeListed: true })
      .andWhere('supply.status = :status', { status: SupplyStatusEnum.AVAILABLE });

    if (lock) {
      query = query.setLock('pessimistic_write');
    }

    const supply = await query.getOne();
    if (!supply) {
      throw new NotFoundException('Product not found');
    }

    if (supply.quantity < quantity) {
      throw new BadRequestException(
        `Only ${supply.quantity} item(s) available for "${supply.supplyName}"`,
      );
    }

    return supply;
  }
}
