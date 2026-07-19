//used by the NestJS at startup.
//provide settings to the TypeOrmModule.
//handles how the app connects to the DB during normal operation.

import { registerAs } from '@nestjs/config';

export interface DbConfig {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
  migrations: string[];
  migrationsRun: boolean;
  migrationsTableName: string;
}

export default registerAs('db', (): DbConfig => ({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT || 5432),
  username: process.env.POSTGRES_USER ?? 'admin',
  password: process.env.POSTGRES_PASSWORD ?? 'admin',
  database: process.env.POSTGRES_DB ?? 'pet_adoption',
  // We keep synchronize false to ensure we only use migrations for schema changes.
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  // Path to where the compiled migrations are located for the application to find them.
  migrations: [__dirname + '/../database/migrations/*.{ts,js}'],
  // Automatically run pending migrations only when the app starts in production.
  migrationsRun: process.env.NODE_ENV === 'production',
  migrationsTableName: 'migrations',
}));
