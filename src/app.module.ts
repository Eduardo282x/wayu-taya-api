import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { EstadosModule } from './estados/estados.module';
import { CiudadesModule } from './ciudades/ciudades.module';
import { ParroquiasModule } from './parroquias/parroquias.module';
import { MunicipiosModule } from './municipios/municipios.module';
import { PersonasModule } from './personas/personas.module';
import { ProgramasModule } from './programas/programas.module';

@Module({
  imports: [EstadosModule, CiudadesModule, ParroquiasModule, MunicipiosModule, PersonasModule, ProgramasModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
