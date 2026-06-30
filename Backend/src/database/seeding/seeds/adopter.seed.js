"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdopters = seedAdopters;
const adopter_entity_1 = require("../../entities/adopter.entity");
const user_entity_1 = require("../../entities/user.entity");
async function seedAdopters(dataSource) {
    const adopterRepo = dataSource.getRepository(adopter_entity_1.Adopter);
    const userRepo = dataSource.getRepository(user_entity_1.User);
    const emails = [
        'adopter1@test.com',
        'adopter2@test.com',
        'adopter3@test.com',
        'adopter4@test.com',
        'adopter5@test.com',
    ];
    for (const email of emails) {
        const user = await userRepo.findOne({
            where: { email },
        });
        if (!user)
            continue;
        const exists = await adopterRepo.findOne({
            where: {
                userId: user.userId,
            },
        });
        const adopterData = {
            user,
            address: 'Amman',
            city: 'Amman',
            registrationDate: '2025-01-01',
        };
        if (exists) {
            await adopterRepo.save(adopterRepo.merge(exists, adopterData));
        }
        else {
            await adopterRepo.save(adopterRepo.create(adopterData));
        }
    }
    console.log('Adopters seeded');
}
