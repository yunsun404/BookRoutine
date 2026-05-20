import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // 1. await를 붙여야 앱 인스턴스가 생성될 때까지 기다려!
  const app = await NestFactory.create(AppModule); 
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // 2. app을 또 선언(const)하지 말고 그냥 실행해!
  await app.listen(3000); 
}
bootstrap();