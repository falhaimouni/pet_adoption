import { Module } from '@nestjs/common';
import { resolve } from 'path';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { appConfig, dbConfig } from './config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { Db } from 'typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, dbConfig],
      envFilePath: [
        resolve(process.cwd(), '..', `env.${process.env.NODE_ENV ?? 'development'}`),
        resolve(process.cwd(), `env.${process.env.NODE_ENV ?? 'development'}`),
      ],
    }),
    DatabaseModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
