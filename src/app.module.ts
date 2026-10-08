import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/roles.guard';

import { envValidationSchema } from './config/env.validation';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { FileLoggerService } from './common/logger/file-logger.service';

import { EventsModule } from './events/events.module';
import { ProvidersModule } from './providers/providers.module';
import { DocumentsModule } from './documents/documents.module';
import { UsersModule } from './users/users.module';
import { PeopleModule } from './people/people.module';
import { ProgramsModule } from './programs/programs.module';
import { MainLoadModule } from './main-load/main-load.module';
import { StoreModule } from './store/store.module';
import { MedicineModule } from './medicine/medicine.module';
import { InventoryModule } from './inventory/inventory.module';
import { DonationsModule } from './donations/donations.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { ReportsModule } from './reports/reports.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './audit/audit.module';
import { AuditContextInterceptor } from './audit/audit-context.interceptor';

@Module({
  imports: [
    // Validación de entorno: fail-fast en el arranque si falta o es débil una clave
    ConfigModule.forRoot({
      isGlobal: true,
      // El archivo ESPECÍFICO del entorno va primero a propósito: dotenv no
      // sobreescribe y gana el primer valor leído, así que poner '.env' antes
      // haría que en producción se usara el .env de desarrollo (con la URL de
      // la base de datos equivocada). '.env' queda como valor por defecto.
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),

    // 1 pool de conexiones para toda la app (antes: 15 pools duplicados)
    PrismaModule,

    // Límite global de tráfico: 120 req/min por IP, con una ráfaga de 15 req/s.
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 120 },
      { name: 'short', ttl: 1_000, limit: 15 },
    ]),

    AuthModule,
    HealthModule,
    EventsModule,
    ProvidersModule,
    DocumentsModule,
    UsersModule,
    PeopleModule,
    ProgramsModule,
    MainLoadModule,
    StoreModule,
    MedicineModule,
    InventoryModule,
    DonationsModule,
    InstitutionsModule,
    ReportsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    FileLoggerService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Contexto de auditoría: establece usuario/IP/user-agent para que los
    // servicios puedan registrar quién hizo cada acción.
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditContextInterceptor,
    },
    // ORDEN IMPORTA: se ejecutan en el orden de declaración.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // 1º frena el tráfico (incluye DoS y fuerza bruta)
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // 2º valida la firma del JWT
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // 3º exige rol, ya con request.user poblado
    },
  ],
})
export class AppModule {}
