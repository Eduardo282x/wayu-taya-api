import { Module } from '@nestjs/common';
import { CiudadesController } from './ciudades.controller';
import { CiudadesService } from './ciudades.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [CiudadesController],
  providers: [CiudadesService, PrismaService]
})
export class CiudadesModule {}
