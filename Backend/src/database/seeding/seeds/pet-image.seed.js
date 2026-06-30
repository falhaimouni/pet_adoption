"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPetImages = seedPetImages;
const pet_entity_1 = require("../../entities/pet.entity");
const pet_image_entity_1 = require("../../entities/pet-image.entity");
async function seedPetImages(dataSource) {
    const petRepo = dataSource.getRepository(pet_entity_1.Pet);
    const imageRepo = dataSource.getRepository(pet_image_entity_1.PetImage);
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
            await imageRepo.save(imageRepo.merge(exists, imageData));
        }
        else {
            await imageRepo.save(imageRepo.create(imageData));
        }
    }
    console.log('Pet Images seeded');
}
