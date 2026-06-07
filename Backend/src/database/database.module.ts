import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseEntities } from './entities';
import { dbConfig } from '../config';
import type { DbConfig } from '../config/db.config';

@Module({
  imports: [
    ConfigModule.forFeature(dbConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [dbConfig.KEY],
      useFactory: (db: DbConfig) => ({
        type: db.type,
        host: db.host,
        port: db.port,
        username: db.username,
        password: db.password,
        database: db.database,
        entities: databaseEntities,
        synchronize: db.synchronize,
        logging: db.logging ?? false,
        migrations: db.migrations,
        migrationsRun: db.migrationsRun,
        migrationsTableName: db.migrationsTableName,
      }),
    }),
  ],
})
export class DatabaseModule {}
