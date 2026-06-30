import { DataSource } from 'typeorm';
import { Pet } from '../../entities/pet.entity';
import { PetImage } from '../../entities/pet-image.entity';

export async function seedPetImages(dataSource: DataSource) {
  const petRepo = dataSource.getRepository(Pet);
  const imageRepo = dataSource.getRepository(PetImage);

  const pets = await petRepo.find();

  for (const pet of pets) {
    const exists = await imageRepo.findOne({
      where: { petId: pet.petId },
    });

    const imageData = {
      pet,
      imageUrl: `https://placehold.co/600x400?text=${pet.petName}`,
    };

    if (exists) {
      await imageRepo.save(
        imageRepo.merge(exists, imageData),
      );
    } else {
      await imageRepo.save(
        imageRepo.create(imageData),
      );
    }
  }

  console.log('Pet Images seeded');
}
