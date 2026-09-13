import { DataSource } from 'typeorm';

import { Cart } from '../../entities/cart.entity';
import { CartItem } from '../../entities/cart-item.entity';
import { Product } from '../../entities/product.entity';
import { User } from '../../entities/user.entity';

export async function seedCartItems(
  dataSource: DataSource,
): Promise<void> {
  const cartRepo = dataSource.getRepository(Cart);
  const productRepo = dataSource.getRepository(Product);
  const userRepo = dataSource.getRepository(User);
  const repo = dataSource.getRepository(CartItem);

  const items = [
    {
      userEmail: 'adopter1@test.com',
      productName: 'Dog Food',
      quantity: 2,
    },
    {
      userEmail: 'adopter1@test.com',
      productName: 'Pet Shampoo',
      quantity: 1,
    },
    {
      userEmail: 'adopter2@test.com',
      productName: 'Cat Food',
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

    const product = await productRepo.findOne({
      where: { productName: item.productName },
    });

    if (!cart || !product) continue;

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
