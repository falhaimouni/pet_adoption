"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedVaccinations = seedVaccinations;
const vaccination_entity_1 = require("../../entities/vaccination.entity");
const pet_entity_1 = require("../../entities/pet.entity");
const user_entity_1 = require("../../entities/user.entity");
async function seedVaccinations(dataSource) {
    const repo = dataSource.getRepository(vaccination_entity_1.Vaccination);
    const petRepo = dataSource.getRepository(pet_entity_1.Pet);
    const userRepo = dataSource.getRepository(user_entity_1.User);
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
                await repo.save(repo.merge(exists, vaccinationData));
            }
            else {
                await repo.save(repo.create(vaccinationData));
            }
        }
    }
    console.log('Vaccinations seeded successfully');
}
