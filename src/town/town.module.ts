import { Module } from '@nestjs/common';
import { CiudadesController } from './town.controller';
import { TownService } from './town.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [CiudadesController],
  providers: [TownService, PrismaService]
})
export class CiudadesModule {}
