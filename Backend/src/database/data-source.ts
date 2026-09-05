//used ONLY by the TypeORM CLI for migrations.
//it manually loads env because NestJS is not yet initialized
//when running migration commands from the terminal.

import 'reflect-metadata';
import 'tsconfig-paths/register';
import { join, resolve } from 'path';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

const isProd = process.env.NODE_ENV === 'production';
const rootDir = process.cwd();

//manually load environment variables based on the current environment
let envPath = resolve(rootDir, `.env.${process.env.NODE_ENV ?? 'development'}`);

//fallback for monorepo structure: check one level up if not found in current directory
if (!require('fs').existsSync(envPath)) {
  envPath = resolve(rootDir, '..', `.env.${process.env.NODE_ENV ?? 'development'}`);
}

dotenv.config({ path: envPath });

export default new DataSource({
  type: 'postgres',
  //logic to handle networking: Use 'localhost' when running commands from your terminal,
  //but use the environment variable (usually 'postgres') when running inside Docker.
  host: process.argv.includes('--isLocal') ? 'localhost' : (process.env.POSTGRES_HOST || 'localhost'),
  port: Number(process.env.POSTGRES_PORT || 5432),
  username: process.env.POSTGRES_USER || 'admin',
  password: process.env.POSTGRES_PASSWORD || 'admin',
  database: process.env.POSTGRES_DB || 'pet_adoption',

  entities: [
    join(rootDir, isProd ? 'dist/**/*.entity.js' : 'src/**/*.entity.ts')
  ],

  migrations: isProd
    ? [join(rootDir, 'dist/database/migrations/*.js')]
    : [join(rootDir, 'src/database/migrations/*.ts')],

  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});
