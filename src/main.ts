import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { buildValidationDetails } from './common/utils/validation-errors.util';

async function bootstrap() {
  // NestExpressApplication (y no INestApplication) para poder usar
  // useBodyParser(), que solo existe en la variante con Express.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // ── 1. Cabeceras de seguridad ──────────────────────────────────────────────
  // helmet no estaba instalado: la API no enviaba HSTS, CSP, X-Content-Type-Options
  // ni X-Frame-Options.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
        },
      },
      hsts: {
        maxAge: 31_536_000, // 1 año
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: 'no-referrer' },
      crossOriginResourcePolicy: { policy: 'same-site' },
      // El API sirve PDFs/DOCX descargables; 'nosniff' evita que el navegador
      // interprete un HTML subido como documento.
      noSniff: true,
      frameguard: { action: 'deny' },
    }),
  );

  // ── 2. CORS restrictivo ───────────────────────────────────────────────────
  // Antes: app.enableCors() sin opciones => refleja CUALQUIER Origin con
  // credentials. Cualquier web podía llamar la API autenticada.
  const allowedOrigins = (config.get<string>('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    throw new Error('ALLOWED_ORIGINS está vacía: revisa el .env');
  }

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // El frontend usa el header Authorization, no cookies.
    credentials: false,
    maxAge: 86_400,
  });

  // ── 3. Confianza en el proxy ───────────────────────────────────────────────
  // Sin esto, X-Forwarded-For es falsificable: el rate limiting por IP se
  // evade y los logs de auditoría registrarían IPs incorrectas.
  // app.set no existe en INestApplication: hay que ir al adaptador HTTP.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // ── 4. Límites del cuerpo ──────────────────────────────────────────────────
  // Evita agotar la memoria con cuerpos gigantes.
  // NO se usa pp.use(json(...)): NestFactory ya registra su propio body parser
  // al crear la app, y como este corre ANTES de que llegue la peticion, el limite
  // de 1mb aqui no tendria efecto (el parser de Nest ya habria consumido el
  // cuerpo). useBodyParser sustituye el parser existente con estos limites.
  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { limit: '1mb', extended: true });

  // ── 5. Pipeline global ─────────────────────────────────────────────────────
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new ResponseInterceptor());
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

  // Sin esto, PrismaService.onModuleDestroy() nunca se ejecuta y el pool de
  // PostgreSQL se queda abierto -> connection leaks en cada despliegue.
  app.enableShutdownHooks();

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`API escuchando en el puerto ${port}`);
  logger.log(`CORS permitido para: ${allowedOrigins.join(', ')}`);
}

void bootstrap();
