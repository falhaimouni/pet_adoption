import { DataSource } from 'typeorm';
import { Pet } from '../../entities/pet.entity';
import { PetImage } from '../../entities/pet-image.entity';
import { FileUpload } from '../../entities/file-upload.entity';
import { FileUploadCategory } from '@shared/enums';

export async function seedPetImages(dataSource: DataSource) {
  const petRepo = dataSource.getRepository(Pet);
  const imageRepo = dataSource.getRepository(PetImage);
  const fileRepo = dataSource.getRepository(FileUpload);

  const pets = await petRepo.find();

  for (const pet of pets) {
    const exists = await imageRepo.findOne({
      where: { petId: pet.petId },
    });

    const fileUrl = `https://placehold.co/600x400?text=${encodeURIComponent(pet.petName)}`;
    let file = await fileRepo.findOne({ where: { fileUrl } });

    if (!file) {
      file = await fileRepo.save(
        fileRepo.create({
          fileName: `${pet.petId}.png`,
          fileSize: 0,
          category: FileUploadCategory.PET_IMAGE,
          fileUrl,
          mimeType: 'image/png',
          uploadedBy: null,
        }),
      );
    }

    const imageData = {
      pet,
      file,
      fileId: file.fileId,
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
