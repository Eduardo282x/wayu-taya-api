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
<<<<<<< HEAD
import { AlmacenModule } from './almacen/almacen.module';
import { MedicinaModule } from './medicina/medicina.module';
import { DonacionesModule } from './donaciones/donaciones.module';
import { InventoryModule } from './inventory/inventory.module';
=======
import { StoreModule } from './store/store.module';
import { MedicineModule } from './medicine/medicine.module';
>>>>>>> 4ea71d267badf7dcbe6af4b5b0b705423a9604cf

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
<<<<<<< HEAD
    AlmacenModule,
    MedicinaModule,
    DonacionesModule,
    InventoryModule,
=======
    StoreModule,
    MedicineModule,
>>>>>>> 4ea71d267badf7dcbe6af4b5b0b705423a9604cf
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
