import { Module } from '@nestjs/common';
import { resolve } from 'path';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { appConfig, dbConfig } from './config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CartModule } from './modules/cart/cart.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UsersModule } from './modules/users/users.module';
import { MedicalModule } from './modules/medical/medical.module';
import { PetsModule } from './modules/pets/pets.module';
import { VaccinationsModule } from './modules/vaccinations/vaccinations.module';
import { InventoryModule } from './modules/inventory/inventory.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, dbConfig],
      envFilePath: [
        resolve(process.cwd(), '..', `.env.${process.env.NODE_ENV ?? 'development'}`),
        resolve(process.cwd(), `.env.${process.env.NODE_ENV ?? 'development'}`),
      ],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CartModule,
    DashboardModule,
    PetsModule,
    MedicalModule,
    VaccinationsModule,
    InventoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
