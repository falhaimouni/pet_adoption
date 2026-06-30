"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedConversations = seedConversations;
const conversation_entity_1 = require("../../entities/conversation.entity");
const adopter_entity_1 = require("../../entities/adopter.entity");
async function seedConversations(dataSource) {
    const repo = dataSource.getRepository(conversation_entity_1.Conversation);
    const adopterRepo = dataSource.getRepository(adopter_entity_1.Adopter);
    const adopters = await adopterRepo.find();
    for (const adopter of adopters.slice(0, 3)) {
        const exists = await repo.findOne({
            where: { adopterId: adopter.adopterId },
        });
        const conversationData = {
            adopter,
            status: 'open',
        };
        if (exists) {
            await repo.save(repo.merge(exists, conversationData));
        }
        else {
            await repo.save(repo.create(conversationData));
        }
    }
    console.log('Conversations seeded');
}
