import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadConfig } from './config';
import { configureApp } from './setup';

async function bootstrap() {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule);
  configureApp(app, config);
  await app.listen(config.port);
  console.log(`API listening on http://localhost:${config.port}`);
}

void bootstrap();
