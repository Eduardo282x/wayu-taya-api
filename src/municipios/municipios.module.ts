import { Module } from '@nestjs/common';
import { MunicipiosController } from './municipios.controller';
import { MunicipiosService } from './municipios.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [MunicipiosController],
  providers: [MunicipiosService, PrismaService]
})
export class MunicipiosModule {}
