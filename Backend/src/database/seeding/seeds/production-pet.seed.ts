import { DataSource } from 'typeorm';

import { PET_STATUS } from '@shared/constants/pet-status.constants';
import { Pet } from '../../entities/pet.entity';
import { User } from '../../entities/user.entity';

export async function seedProductionPets(
  dataSource: DataSource,
): Promise<void> {
  const petRepo = dataSource.getRepository(Pet);
  const userRepo = dataSource.getRepository(User);
  const creator = await userRepo.findOne({
    where: { email: process.env.PRODUCTION_MANAGER_EMAIL },
  });

  if (!creator) {
    throw new Error('Production manager must exist before production pets');
  }

  const pets = [
    { petName: 'Production Dog', species: 'Dog' },
    { petName: 'Production Cat', species: 'Cat' },
    { petName: 'Production Bird', species: 'Bird' },
  ];

  for (const pet of pets) {
    const existingPet = await petRepo.findOne({
      where: { petName: pet.petName },
    });
    const petData = {
      ...pet,
      adoptionStatus: PET_STATUS.AVAILABLE,
      healthStatus: 'Healthy',
      createdByUser: creator,
    };

    if (existingPet) {
      await petRepo.save(petRepo.merge(existingPet, petData));
    } else {
      await petRepo.save(petRepo.create(petData));
    }
  }

  console.log('Production pets seeded without images');
}
