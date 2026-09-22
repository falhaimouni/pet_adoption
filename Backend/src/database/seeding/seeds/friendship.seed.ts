import { DataSource } from 'typeorm';

import { Friendship } from '../../entities/friendship.entity';
import { User } from '../../entities/user.entity';
import {
  FRIEND_AUTO_ROLES,
  FRIEND_SYSTEM_ROLES,
} from '@shared/constants/chat.constants';

export async function seedFriendships(dataSource: DataSource) {
  const friendshipRepo = dataSource.getRepository(Friendship);
  const userRepo = dataSource.getRepository(User);

  const users = await userRepo.find({
    relations: ['role'],
  });

  const staffUsers = users.filter(
    (user) =>
      user.status === 'active' &&
      FRIEND_SYSTEM_ROLES.includes(
        user.role.roleName as (typeof FRIEND_SYSTEM_ROLES)[number],
      ),
  );

  const processedPairs = new Set<string>();

  for (const user of staffUsers) {
    const roleName = user.role.roleName as (typeof FRIEND_SYSTEM_ROLES)[number];
    const targetRoles = (FRIEND_AUTO_ROLES as readonly string[]).includes(roleName)
      ? FRIEND_SYSTEM_ROLES.filter((candidate) => candidate !== roleName)
      : FRIEND_AUTO_ROLES;

    for (const target of staffUsers) {
      if (target.userId === user.userId) {
        continue;
      }

      if (!targetRoles.includes(target.role.roleName as any)) {
        continue;
      }

      const pair = normalizePair(user.userId, target.userId);
      const pairKey = `${pair.user1Id}:${pair.user2Id}`;

      if (processedPairs.has(pairKey)) {
        continue;
      }
      processedPairs.add(pairKey);

      const exists = await friendshipRepo.findOne({
        where: {
          user1Id: pair.user1Id,
          user2Id: pair.user2Id,
        },
      });

      if (exists) {
        if (!exists.isSystemGenerated) {
          exists.isSystemGenerated = true;
          exists.createdByUserId = null;
          await friendshipRepo.save(exists);
        }
        continue;
      }

      await friendshipRepo.save(
        friendshipRepo.create({
          user1Id: pair.user1Id,
          user2Id: pair.user2Id,
          createdByUserId: null,
          isSystemGenerated: true,
        }),
      );
    }
  }

  const systemFriendships = await friendshipRepo.find({
    where: { isSystemGenerated: true },
  });
  const obsoleteIds = systemFriendships
    .filter((friendship) => {
      const pair = normalizePair(friendship.user1Id, friendship.user2Id);
      return !processedPairs.has(`${pair.user1Id}:${pair.user2Id}`);
    })
    .map((friendship) => friendship.friendshipId);

  if (obsoleteIds.length > 0) {
    await friendshipRepo.delete(obsoleteIds);
  }

  console.log('Friendships seeded');
}

function normalizePair(userId1: string, userId2: string) {
  return userId1 < userId2
    ? { user1Id: userId1, user2Id: userId2 }
    : { user1Id: userId2, user2Id: userId1 };
}
