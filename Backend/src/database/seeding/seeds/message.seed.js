"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedMessages = seedMessages;
const message_entity_1 = require("../../entities/message.entity");
const conversation_entity_1 = require("../../entities/conversation.entity");
const user_entity_1 = require("../../entities/user.entity");
async function seedMessages(dataSource) {
    const repo = dataSource.getRepository(message_entity_1.Message);
    const convRepo = dataSource.getRepository(conversation_entity_1.Conversation);
    const userRepo = dataSource.getRepository(user_entity_1.User);
    const conversations = await convRepo.find();
    const user = await userRepo.findOne({
        where: { email: 'admin@test.com' },
    });
    if (!user) {
        console.log('Admin user not found');
        return;
    }
    for (const conv of conversations) {
        const exists = await repo.findOne({
            where: { conversationId: conv.conversationId },
        });
        const messageData = {
            sender: user,
            conversation: conv,
            messageText: 'Hello, how can we help you?',
        };
        if (exists) {
            await repo.save(repo.merge(exists, messageData));
        }
        else {
            await repo.save(repo.create(messageData));
        }
    }
    console.log('Messages seeded');
}
