import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseEntities } from './entities';
import { dbConfig } from '../config';

@Module({
  imports: [
    ConfigModule.forFeature(dbConfig),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        const db = configService.get('db');

        return {
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
        };
      },
    }),
  ],
})
export class DatabaseModule {}