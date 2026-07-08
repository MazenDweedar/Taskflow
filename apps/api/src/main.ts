import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Cookie parser
  app.use(cookieParser(configService.get<string>('COOKIE_SECRET')));

  // CORS — allow the Next.js frontend origin with credentials (cookie-based auth)
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  app.enableCors({
    origin: (origin: any, callback: any) => {
      const allowedOrigins = frontendUrl.split(',').map((o) => o.trim());
      // Allow requests with no origin (e.g. server-side, curl)
      // Allow exact matches or Vercel preview deployments
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Global validation pipe

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TaskFlow API')
    .setDescription('Project & task management API')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`🚀 TaskFlow API running on http://localhost:${port}`);
  console.log(`📖 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
