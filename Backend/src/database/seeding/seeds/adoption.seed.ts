import { DataSource } from 'typeorm';
import { Adoption } from '../../entities/adoption.entity';
import { AdoptionRequest } from '../../entities/adoption-request.entity';
import { request } from 'https';

export async function seedAdoptions(dataSource: DataSource) {
  const repo = dataSource.getRepository(Adoption);
  const requestRepo = dataSource.getRepository(AdoptionRequest);

  const requests = await requestRepo.find({
    where: { status: 'approved' },
  });

  for (const req of requests) {
    const exists = await repo.findOne({
      where: { requestId: req.requestId },
    });

    const adoptionData = {
      request: req,
      adoptionDate: new Date().toISOString().split('T')[0],
      adoptionFee: '100',
    };

    if (exists) {
      await repo.save(
        repo.merge(exists, adoptionData),
      );
    } else {
      await repo.save(
        repo.create(adoptionData),
      );
    }
  }

  console.log('Adoptions seeded');
}
