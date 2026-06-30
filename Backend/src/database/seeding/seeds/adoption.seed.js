"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdoptions = seedAdoptions;
const adoption_entity_1 = require("../../entities/adoption.entity");
const adoption_request_entity_1 = require("../../entities/adoption-request.entity");
async function seedAdoptions(dataSource) {
    const repo = dataSource.getRepository(adoption_entity_1.Adoption);
    const requestRepo = dataSource.getRepository(adoption_request_entity_1.AdoptionRequest);
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
            contractStatus: 'signed',
        };
        if (exists) {
            await repo.save(repo.merge(exists, adoptionData));
        }
        else {
            await repo.save(repo.create(adoptionData));
        }
    }
    console.log('Adoptions seeded');
}
