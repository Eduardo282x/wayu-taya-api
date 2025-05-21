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
import { AlmacenModule } from './almacen/almacen.module';
import { MedicinaModule } from './medicina/medicina.module';

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
    AlmacenModule,
    MedicinaModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
