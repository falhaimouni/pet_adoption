import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: Number(process.env.PORT ?? 3000),
  version: process.env.APP_VERSION ?? process.env.npm_package_version ?? 'dev',
  nodeEnv: process.env.NODE_ENV ?? 'development',
}));
