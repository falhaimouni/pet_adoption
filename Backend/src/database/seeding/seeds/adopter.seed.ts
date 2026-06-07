import { DataSource } from 'typeorm';

import { Adopter } from '../../entities/adopter.entity';
import { User } from '../../entities/user.entity';

export async function seedAdopters(
  dataSource: DataSource,
): Promise<void> {
  const adopterRepo = dataSource.getRepository(Adopter);

  const userRepo = dataSource.getRepository(User);

  const emails = [
    'adopter1@test.com',
    'adopter2@test.com',
    'adopter3@test.com',
    'adopter4@test.com',
    'adopter5@test.com',
  ];

  for (const email of emails) {
    const user =
      await userRepo.findOne({
        where: { email },
      });

    if (!user) continue;

    const exists =
      await adopterRepo.findOne({
        where: {
          userId: user.userId,
        },
      });

    if (!exists) {
      await adopterRepo.save(
        adopterRepo.create({
          user,
          address: 'Amman',
          city: 'Amman',
          registrationDate:
            '2025-01-01',
        }),
      );
    }
  }

  console.log('Adopters seeded');
}