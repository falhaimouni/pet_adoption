import { DataSource } from 'typeorm';

import { Cart } from '../../entities/cart.entity';
import { User } from '../../entities/user.entity';

export async function seedCarts(
  dataSource: DataSource,
): Promise<void> {
  const cartRepo = dataSource.getRepository(Cart);
  const userRepo = dataSource.getRepository(User);

  const carts = [
    {
      cartId: '550e8400-e29b-41d4-a716-446655442000',
      userEmail: 'adopter1@test.com',
    },
    {
      cartId: '550e8400-e29b-41d4-a716-446655442001',
      userEmail: 'adopter2@test.com',
    },
  ];

  for (const cart of carts) {
    const user = await userRepo.findOne({
      where: { email: cart.userEmail },
    });

    if (!user) continue;

    const exists = await cartRepo.findOne({
      where: { userId: user.userId },
    });

    const cartData = {
      cartId: cart.cartId,
      userId: user.userId,
      user,
    };

    if (exists) {
      await cartRepo.save(cartRepo.merge(exists, cartData));
    } else {
      await cartRepo.save(cartRepo.create(cartData));
    }
  }

  console.log('Carts seeded');
}