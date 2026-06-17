import { DataSource } from 'typeorm';
import { Role } from '../../entities/role.entity';

export async function seedRoles(
  dataSource: DataSource,
): Promise<void> {
  const repo = dataSource.getRepository(Role);

  const roles = [
    'ADMIN',
    'MANAGER',
    'VET',
    'EMPLOYEE',
    'ADOPTER',
  ];

  for (const roleName of roles) {
    const exists = await repo.findOne({
      where: { roleName },
    });

    if (!exists) {
      await repo.save(
        repo.create({
          roleName,
        }),
      );
    }
  }

  console.log('Roles seeded');
}