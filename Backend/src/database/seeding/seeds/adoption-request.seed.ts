import { DataSource } from 'typeorm';
import { AdoptionRequest } from '../../entities/adoption-request.entity';
import { Adopter } from '../../entities/adopter.entity';
import { Pet } from '../../entities/pet.entity';

export async function seedAdoptionRequests(dataSource: DataSource) {
  const repo = dataSource.getRepository(AdoptionRequest);
  const adopterRepo = dataSource.getRepository(Adopter);
  const petRepo = dataSource.getRepository(Pet);

  const adopters = await adopterRepo.find();
  const pets = await petRepo.find();

  let statusCycle = ['pending', 'approved', 'rejected'];
  let i = 0;

  for (const adopter of adopters) {
    const pet = pets[i % pets.length];

    const exists = await repo.findOne({
      where: {
        adopterId: adopter.adopterId,
        petId: pet.petId,
      },
    });

    if (!exists) {
      await repo.save(
        repo.create({
          adopter,
          pet,
          status: statusCycle[i % 3],
          requestDate: new Date().toISOString().split('T')[0],
          notes: 'Seed request',
        }),
      );
    }

    i++;
  }

  console.log('Adoption Requests seeded');
}