import { DataSource } from 'typeorm';
import { Vaccination } from '../../entities/vaccination.entity';
import { Pet } from '../../entities/pet.entity';
import { User } from '../../entities/user.entity';

export async function seedVaccinations(dataSource: DataSource) {
  const repo = dataSource.getRepository(Vaccination);
  const petRepo = dataSource.getRepository(Pet);
  const userRepo = dataSource.getRepository(User);

  const pets = await petRepo.find();

  const vet = await userRepo.findOne({
    where: { email: 'vet@test.com' },
  });

  if (!vet || pets.length === 0) {
    console.log('Skipping vaccination seed: missing vet or pets');
    return;
  }

  const sampleVaccinations = [
    {
      vaccineName: 'Rabies',
      vaccinationDate: '2024-06-01',
      nextDueDate: '2025-06-01',
    },
    {
      vaccineName: 'Distemper',
      vaccinationDate: '2024-08-15',
      nextDueDate: '2025-08-15',
    },
  ];

  for (const pet of pets) {
    for (const data of sampleVaccinations) {
      const exists = await repo.findOne({
        where: {
          pet: { petId: pet.petId },
          vaccineName: data.vaccineName,
          vaccinationDate: data.vaccinationDate,
        },
      });

      const vaccinationData = {
        ...data,
        pet,
        veterinarian: vet,
      };

      if (exists) {
        await repo.save(
          repo.merge(exists, vaccinationData),
        );
      } else {
        await repo.save(
          repo.create(vaccinationData),
        );
      }
    }
  }

  console.log('Vaccinations seeded successfully');
}
