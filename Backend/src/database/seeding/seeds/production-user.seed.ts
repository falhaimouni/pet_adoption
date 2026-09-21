import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Role } from '../../entities/role.entity';
import { User } from '../../entities/user.entity';

type ProductionUser = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleName: string;
};

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required production seed environment variable: ${name}`);
  }

  return value;
}

export async function seedProductionUsers(
  dataSource: DataSource,
): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);

  const users: ProductionUser[] = [
    {
      firstName: 'Production',
      lastName: 'Admin',
      email: requiredEnvironmentVariable('PRODUCTION_ADMIN_EMAIL'),
      password: requiredEnvironmentVariable('PRODUCTION_ADMIN_PASSWORD'),
      roleName: 'ADMIN',
    },
    {
      firstName: 'Production',
      lastName: 'Manager',
      email: requiredEnvironmentVariable('PRODUCTION_MANAGER_EMAIL'),
      password: requiredEnvironmentVariable('PRODUCTION_MANAGER_PASSWORD'),
      roleName: 'MANAGER',
    },
    {
      firstName: 'Production',
      lastName: 'Veterinarian',
      email: requiredEnvironmentVariable('PRODUCTION_VET_EMAIL'),
      password: requiredEnvironmentVariable('PRODUCTION_VET_PASSWORD'),
      roleName: 'VET',
    },
    {
      firstName: 'Production',
      lastName: 'Employee One',
      email: requiredEnvironmentVariable('PRODUCTION_EMPLOYEE_ONE_EMAIL'),
      password: requiredEnvironmentVariable('PRODUCTION_EMPLOYEE_ONE_PASSWORD'),
      roleName: 'EMPLOYEE',
    },
    {
      firstName: 'Production',
      lastName: 'Employee Two',
      email: requiredEnvironmentVariable('PRODUCTION_EMPLOYEE_TWO_EMAIL'),
      password: requiredEnvironmentVariable('PRODUCTION_EMPLOYEE_TWO_PASSWORD'),
      roleName: 'EMPLOYEE',
    },
    {
      firstName: 'Production',
      lastName: 'Employee Three',
      email: requiredEnvironmentVariable('PRODUCTION_EMPLOYEE_THREE_EMAIL'),
      password: requiredEnvironmentVariable('PRODUCTION_EMPLOYEE_THREE_PASSWORD'),
      roleName: 'EMPLOYEE',
    },
  ];

  for (const user of users) {
    const role = await roleRepo.findOne({
      where: { roleName: user.roleName, isActive: true },
    });

    if (!role) {
      throw new Error(`Role must exist before production users: ${user.roleName}`);
    }

    const existingUser = await userRepo.findOne({
      where: { email: user.email },
    });

    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: await bcrypt.hash(user.password, 10),
      role,
      status: 'active',
    };

    if (existingUser) {
      await userRepo.update(existingUser.userId, userData);
    } else {
      await userRepo.save(userRepo.create(userData));
    }
  }

  console.log('Production users seeded');
}