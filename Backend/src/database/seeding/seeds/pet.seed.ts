import { DataSource } from 'typeorm';

import { Pet } from '../../entities/pet.entity';
import { User } from '../../entities/user.entity';

export async function seedPets(
  dataSource: DataSource,
): Promise<void> {
  const petRepo = dataSource.getRepository(Pet);

  const userRepo = dataSource.getRepository(User);

  const creator = await userRepo.findOne({
      where: {
        email: 'manager@test.com',
      },
    });

  const pets = [
    {
      petId: '550e8400-e29b-41d4-a716-446655440000',
      petName: 'Max',
      species: 'Dog',
    },
    {
      petId: '550e8400-e29b-41d4-a716-446655440001',
      petName: 'Luna',
      species: 'Cat',
    },
    {
      petId: '550e8400-e29b-41d4-a716-446655440002',
      petName: 'Bella',
      species: 'Dog',
    },
    {
      petId: '550e8400-e29b-41d4-a716-446655440003',
      petName: 'Rocky',
      species: 'Dog',
    },
    {
      petId: '550e8400-e29b-41d4-a716-446655440004',
      petName: 'Charlie',
      species: 'Bird',
    },
    {
      petId: '550e8400-e29b-41d4-a716-446655440005',
      petName: 'Milo',
      species: 'Cat',
    },
    {
      petId: '550e8400-e29b-41d4-a716-446655440006',
      petName: 'Leo',
      species: 'Dog',
    },
    {
      petId: '550e8400-e29b-41d4-a716-446655440007',
      petName: 'Coco',
      species: 'Rabbit',
    },
    {
      petId: '550e8400-e29b-41d4-a716-446655440008',
      petName: 'Buddy',
      species: 'Dog',
    },
    {
      petId: '550e8400-e29b-41d4-a716-446655440009',
      petName: 'Daisy',
      species: 'Cat',
    },
  ];

  for (const pet of pets) {
    const exists =
      await petRepo.findOne({
        where: {
          petId: pet.petId,
        },
      });

    if (!exists) {
      await petRepo.save(
        petRepo.create({
          ...pet,
          adoptionStatus:
            'available',
          healthStatus:
            'Healthy',
          createdByUser:
            creator ?? undefined,
        }),
      );
    }
  }

  console.log('Pets seeded');
}