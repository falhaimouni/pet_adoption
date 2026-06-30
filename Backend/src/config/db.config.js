"use strict";
//used by the NestJS at startup.
//provide settings to the TypeOrmModule.
//handles how the app connects to the DB during normal operation.
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('db', () => ({
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
