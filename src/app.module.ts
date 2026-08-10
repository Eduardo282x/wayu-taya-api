import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { EstadosModule } from './state/state.module';
import { CiudadesModule } from './town/town.module';
import { ParroquiasModule } from './parroquias/parroquias.module';
import { MunicipiosModule } from './municipios/municipios.module';
import { EventsModule } from './events/events.module';
import { ProvidersModule } from './providers/providers.module';
import { DocumentsModule } from './documents/documents.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PeopleModule } from './people/people.module';
import { ProgramsModule } from './programs/programs.module';
import { MainLoadModule } from './main-load/main-load.module';
import { StoreModule } from './store/store.module';
import { MedicineModule } from './medicine/medicine.module';
import { InventoryModule } from './inventory/inventory.module';
import { DonationsModule } from './donations/donations.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { ReportsModule } from './reports/reports.module';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth/auth.guard';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { FileLoggerService } from './common/logger/file-logger.service';

@Module({
  imports: [
    EstadosModule,
    CiudadesModule,
    ParroquiasModule,
    MunicipiosModule,
    EventsModule,
    ProvidersModule,
    DocumentsModule,
    UsersModule,
    AuthModule,
    PeopleModule,
    ProgramsModule,
    MainLoadModule,
    StoreModule,
    MedicineModule,
    InventoryModule,
    DonationsModule,
    InstitutionsModule,
    ReportsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    JwtService,
    FileLoggerService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // se ejecuta primero
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: RolesGuard, // se ejecuta después, depende del user ya autenticado
    // },
  ],
})
export class AppModule {}
