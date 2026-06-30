import { DataSource } from 'typeorm';
import { Message } from '../../entities/message.entity';
import { Conversation } from '../../entities/conversation.entity';
import { User } from '../../entities/user.entity';

export async function seedMessages(dataSource: DataSource) {
  const repo = dataSource.getRepository(Message);
  const convRepo = dataSource.getRepository(Conversation);
  const userRepo = dataSource.getRepository(User);

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
      await repo.save(
        repo.merge(exists, messageData),
      );
    } else {
      await repo.save(
        repo.create(messageData),
      );
    }
  }

  console.log('Messages seeded');
}
