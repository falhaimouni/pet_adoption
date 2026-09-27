import { DataSource } from 'typeorm';

import { Cart } from '../../entities/cart.entity';
import { CartItem } from '../../entities/cart-item.entity';
import { Supply } from '../../entities/supply.entity';
import { SupplyStatusEnum } from '@shared/enums/supply-status.enum';
import { User } from '../../entities/user.entity';

export async function seedCartItems(
  dataSource: DataSource,
): Promise<void> {
  const cartRepo = dataSource.getRepository(Cart);
  const supplyRepo = dataSource.getRepository(Supply);
  const userRepo = dataSource.getRepository(User);
  const repo = dataSource.getRepository(CartItem);

  const items = [
    {
      userEmail: 'adopter1@test.com',
      productName: 'Adult Dog Food',
      quantity: 2,
    },
    {
      userEmail: 'adopter1@test.com',
      productName: 'Pet Shampoo',
      quantity: 1,
    },
    {
      userEmail: 'adopter2@test.com',
      productName: 'Adult Cat Food',
      quantity: 1,
    },
    {
      userEmail: 'adopter2@test.com',
      productName: 'Pet Leash',
      quantity: 2,
    },
  ];

  for (const item of items) {
    const user = await userRepo.findOne({
      where: { email: item.userEmail },
    });

    if (!user) continue;

    const cart = await cartRepo.findOne({
      where: { userId: user.userId },
    });

    const supply = await supplyRepo.findOne({
      where: {
        supplyName: item.productName,
        isActive: true,
        storeListed: true,
        status: SupplyStatusEnum.AVAILABLE,
      },
      relations: ['product'],
    });
    const product = supply?.product;

    if (!cart || !supply || !product || supply.quantity < item.quantity) continue;

    const unitPrice = Number(product.unitPrice);
    const subtotal = unitPrice * item.quantity;

    const exists = await repo.findOne({
      where: {
        cartId: cart.cartId,
        productId: product.productId,
      },
    });

    const cartItemData = {
      cartId: cart.cartId,
      productId: product.productId,
      quantity: item.quantity,
      unitPrice: unitPrice.toFixed(2),
      subtotal: subtotal.toFixed(2),
    };

    if (exists) {
      await repo.save(repo.merge(exists, cartItemData));
    } else {
      await repo.save(repo.create(cartItemData));
    }
  }

  console.log('Cart items seeded');
}
