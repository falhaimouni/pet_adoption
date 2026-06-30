"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdoptionRequests = seedAdoptionRequests;
const adoption_request_entity_1 = require("../../entities/adoption-request.entity");
const adopter_entity_1 = require("../../entities/adopter.entity");
const pet_entity_1 = require("../../entities/pet.entity");
async function seedAdoptionRequests(dataSource) {
    const repo = dataSource.getRepository(adoption_request_entity_1.AdoptionRequest);
    const adopterRepo = dataSource.getRepository(adopter_entity_1.Adopter);
    const petRepo = dataSource.getRepository(pet_entity_1.Pet);
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
        const requestData = {
            adopter,
            pet,
            status: statusCycle[i % 3],
            requestDate: new Date().toISOString().split('T')[0],
            notes: 'Seed request',
        };
        if (exists) {
            await repo.save(repo.merge(exists, requestData));
        }
        else {
            await repo.save(repo.create(requestData));
        }
        i++;
    }
    console.log('Adoption Requests seeded');
}
