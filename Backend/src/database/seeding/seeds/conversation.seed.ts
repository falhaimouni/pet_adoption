import { DataSource } from 'typeorm';
import { Conversation } from '../../entities/conversation.entity';
import { Adopter } from '../../entities/adopter.entity';

export async function seedConversations(dataSource: DataSource) {
  const repo = dataSource.getRepository(Conversation);
  const adopterRepo = dataSource.getRepository(Adopter);

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
      await repo.save(
        repo.merge(exists, conversationData),
      );
    } else {
      await repo.save(
        repo.create(conversationData),
      );
    }
  }

  console.log('Conversations seeded');
}
