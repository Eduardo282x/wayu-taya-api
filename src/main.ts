import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth/auth.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { buildValidationDetails } from './common/utils/validation-errors.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('/api');

  app.useGlobalGuards(new AuthGuard(app.get(JwtService)));

  app.useGlobalInterceptors(
    // new LoggingInterceptor(logger),
    new ResponseInterceptor(),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const details = buildValidationDetails(errors);
        const summary = details
          .map((detail) => `${detail.field}: ${detail.messages.join(', ')}`)
          .join('; ');
        return new BadRequestException({
          message: summary || 'Datos de entrada inválidos',
          errors: details,
        });
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Aplicacion corriendo en el puerto ${process.env.PORT ?? 3000}`);
}
bootstrap();

// nuevo comentario