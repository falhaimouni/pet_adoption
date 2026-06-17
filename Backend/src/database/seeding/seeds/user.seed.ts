import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';

export async function seedUsers(
  dataSource: DataSource,
): Promise<void> {
  const userRepo =
    dataSource.getRepository(User);

  const roleRepo =
    dataSource.getRepository(Role);

  const adminRole =
    await roleRepo.findOne({
      where: {
        roleName: 'ADMIN',
      },
    });

  const managerRole =
    await roleRepo.findOne({
      where: {
        roleName: 'MANAGER',
      },
    });

  const vetRole =
    await roleRepo.findOne({
      where: {
        roleName: 'VET',
      },
    });

  const employeeRole =
    await roleRepo.findOne({
      where: {
        roleName: 'EMPLOYEE',
      },
    });

  const adopterRole =
    await roleRepo.findOne({
      where: {
        roleName: 'ADOPTER',
      },
    });

  if (
    !adminRole ||
    !managerRole ||
    !vetRole ||
    !employeeRole ||
    !adopterRole
  ) {
    throw new Error(
      'Roles must exist before users',
    );
  }

  const users = [
    {
      firstName: 'Shahd',
      lastName: 'Admin',
      email: 'admin@test.com',
      password: 'admin123',
      role: adminRole,
      status: 'active',
    },

    {
      firstName: 'Farah',
      lastName: 'Vet',
      email: 'vet@test.com',
      password: '12345678',
      role: vetRole,
      status: 'active',
    },

    {
      firstName: 'Lubna',
      lastName: 'Support',
      email: 'support@test.com',
      password: '12345678',
      role: employeeRole,
      status: 'active',
    },

    {
      firstName: 'Roaa',
      lastName: 'Manager',
      email: 'manager@test.com',
      password: '12345678',
      role: managerRole,
      status: 'active',
    },

    {
      firstName: 'Joud',
      lastName: 'Adopter',
      email: 'adopter1@test.com',
      password: '12345678',
      role: adopterRole,
      status: 'active',
    },

    {
      firstName: 'Maya',
      lastName: 'Adopter',
      email: 'adopter2@test.com',
      password: '12345678',
      role: adopterRole,
      status: 'active',
    },

    {
      firstName: 'Noor',
      lastName: 'Adopter',
      email: 'adopter3@test.com',
      password: '12345678',
      role: adopterRole,
      status: 'active',
    },

    {
      firstName: 'Yousef',
      lastName: 'Adopter',
      email: 'adopter4@test.com',
      password: '12345678',
      role: adopterRole,
      status: 'active',
    },

    {
      firstName: 'Leen',
      lastName: 'Adopter',
      email: 'adopter5@test.com',
      password: '12345678',
      role: adopterRole,
      status: 'active',
    },
  ];

  for (const user of users) {
    const exists =
      await userRepo.findOne({
        where: {
          email: user.email,
        },
      });

    const hashedPassword = await bcrypt.hash(user.password, 10);
    const userData = {
      ...user,
      password: hashedPassword,
    };

    if (exists) {
      // Update existing user with new data from seed
      await userRepo.update(exists.userId, userData);
    } else {
      // Create user if they don't exist
      await userRepo.save(userRepo.create(userData));
    }
  }

  console.log('Users seeded');
}