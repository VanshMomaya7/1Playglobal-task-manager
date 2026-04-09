import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

function parseCorsOrigins(value?: string) {
  const raw = (value ?? '').trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins =
    parseCorsOrigins(process.env.CORS_ORIGINS) || [
      'http://localhost:5173',
      'http://localhost:4173',
    ];

  app.enableCors({
    origin: corsOrigins.length ? corsOrigins : true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true,
  });

  // Render / other proxies terminate TLS; harmless for cookie + forwarded headers
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter?.getInstance?.()?.set) {
    httpAdapter.getInstance().set('trust proxy', 1);
  }

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();
