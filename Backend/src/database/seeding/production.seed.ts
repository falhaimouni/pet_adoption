import 'reflect-metadata';

import AppDataSource from '../data-source';
import { seedDepartments } from './seeds/department.seed';
import { seedProductionEmployees } from './seeds/production-employee.seed';
import { seedProductionPets } from './seeds/production-pet.seed';
import { seedProductionUsers } from './seeds/production-user.seed';
import { seedRoles } from './seeds/role.seed';

async function runProductionSeed(): Promise<void> {
  try {
    await AppDataSource.initialize();
    await seedRoles(AppDataSource);
    await seedDepartments(AppDataSource);
    await seedProductionUsers(AppDataSource);
    await seedProductionEmployees(AppDataSource);
    await seedProductionPets(AppDataSource);
    console.log('Production seeding completed successfully');
  } catch (error) {
    console.error('Production seeding failed:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

runProductionSeed();