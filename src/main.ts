import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger sozlamalari
  const config = new DocumentBuilder()
    .setTitle('Hunarmand API')
    .setDescription('Hunarmand loyihasi API hujjatlari')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // ❌ oldingi funksiya emas, document beriladi

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // faqat DTO dagi propertylarni qabul qiladi
      forbidNonWhitelisted: true, // keraksiz property bo‘lsa xato beradi
      transform: true, // avtomatik transform qiladi (string -> number)
    }),
  );

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
