import { BadRequestException, INestApplication, UnsupportedMediaTypeException, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import type { AppConfig } from './config';

/** Shared setup for the server and the e2e tests. */
export function configureApp(app: INestApplication, config: AppConfig) {
  const express = app.getHttpAdapter().getInstance();
  // Behind one proxy (the Next.js server or a load balancer): use its client IP for rate limits
  express.set('trust proxy', 1);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: config.webOrigin, credentials: true });

  // Cookie sessions + JSON-only writes: a cross-site HTML form cannot send application/json,
  // so this blocks CSRF without a separate token.
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const writes = ['POST', 'PUT', 'PATCH', 'DELETE'];
    const hasBody = Number(req.headers['content-length'] || 0) > 0;
    if (writes.includes(req.method) && hasBody && !req.is('application/json')) {
      return next(new UnsupportedMediaTypeException('Send JSON'));
    }
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: 'Please check the highlighted fields',
          fields: Object.fromEntries(
            errors.map((e) => [e.property, Object.values(e.constraints ?? {})[0] ?? 'Invalid value']),
          ),
        }),
    }),
  );
  app.enableShutdownHooks();
}
