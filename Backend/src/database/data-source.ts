//used ONLY by the TypeORM CLI for migrations.
//it manually loads env because NestJS is not yet initialized
//when running migration commands from the terminal.

import 'reflect-metadata';
import { join, resolve } from 'path';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

//need it in development to resolve paths based on tsconfig.json, but not in production (compiled) because the paths are already resolved in the compiled JS files.
if (process.env.NODE_ENV !== 'production') {
  require('tsconfig-paths/register');
}

const rootDir = process.cwd();
//ts for development, js for production (compiled)
const compiledExtension = __filename.endsWith('.js') ? 'js' : 'ts';

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

  //__dirname is the directory of this file (data-source.ts)
  entities: [
    join(__dirname, 'entities', `**/*.entity.${compiledExtension}`),
  ],

  migrations: [
    join(__dirname, 'migrations', `*.${compiledExtension}`),
  ],

  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});
