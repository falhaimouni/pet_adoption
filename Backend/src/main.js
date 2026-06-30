"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata"); // Must be the first import
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // Crucial: This enables the @IsEmail, @MinLength, etc. validations in your DTOs
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    // Allow the frontend to call this backend from a different port during development
    app.enableCors({
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
        ],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT') ?? 3000;
    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}`);
}
void bootstrap();
