import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { EstadosModule } from './state/state.module';
import { CiudadesModule } from './town/town.module';
import { ParroquiasModule } from './parroquias/parroquias.module';
import { MunicipiosModule } from './municipios/municipios.module';
import { EventsModule } from './events/events.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { DocumentsModule } from './documents/documents.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { PersonasModule } from './personas/personas.module';
import { ProgramasModule } from './programas/programas.module';
import { MainLoadModule } from './main-load/main-load.module';
import { StoreModule } from './store/store.module';
import { MedicineModule } from './medicine/medicine.module';
import { InventoryModule } from './inventory/inventory.module';
import { DonationsModule } from './donations/donations.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    EstadosModule,
    CiudadesModule,
    ParroquiasModule,
    MunicipiosModule,
    EventsModule,
    ProveedoresModule,
    DocumentsModule,
    UsuariosModule,
    AuthModule,
    PersonasModule,
    ProgramasModule,
    MainLoadModule,
    StoreModule,
    MedicineModule,
    InventoryModule,
    DonationsModule,
    InstitutionsModule,
    ReportsModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
