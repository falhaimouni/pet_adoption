//connect to db then run seed service then disconnect db
//to read decorators
import 'reflect-metadata';
import AppDataSource from '../data-source';
import { SeedService } from './seed.service';

async function runSeed() {
  try {
    await AppDataSource.initialize();
    //so it can access the repositories to perform seeding operations
    const seedService = new SeedService(AppDataSource);

    await seedService.seed();

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
  //always disconnect from the DB 
  finally {
    await AppDataSource.destroy();
  }
}

runSeed();