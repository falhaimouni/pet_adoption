import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { resolve } from 'path';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { appConfig, dbConfig } from './config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { OAuthModule } from './modules/oauth/oauth.module';
import { CartModule } from './modules/cart/cart.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UsersModule } from './modules/users/users.module';
import { MedicalModule } from './modules/medical/medical.module';
import { PetsModule } from './modules/pets/pets.module';
import { VaccinationsModule } from './modules/vaccinations/vaccinations.module';
import { AdoptionsModule } from './modules/adoptions/adoptions.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { StoreModule } from './modules/store/store.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PreventEmailChangeMiddleware } from './common/middleware/prevent-email-change.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, dbConfig],
      envFilePath: [
        resolve(
          process.cwd(),
          '..',
          `.env.${process.env.NODE_ENV ?? 'development'}`,
        ),
        resolve(
          process.cwd(),
          `.env.${process.env.NODE_ENV ?? 'development'}`,
        ),
      ],
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 20,
      },
    ]),

    DatabaseModule,
    AuthModule,
    OAuthModule,
    UsersModule,
    CartModule,
    DashboardModule,
    PetsModule,
    MedicalModule,
    VaccinationsModule,
    AdoptionsModule,
    InventoryModule,
    UploadsModule,
    StoreModule,
    ReportsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PreventEmailChangeMiddleware)
      .forRoutes(
        { path: 'users/profile', method: RequestMethod.PATCH },
        { path: 'users/:id', method: RequestMethod.PATCH },
      );
  }
}
