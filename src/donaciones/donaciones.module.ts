import { Module } from '@nestjs/common';
import { DonacionesController } from './donaciones.controller';
import { DonacionesService } from './donaciones.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [DonacionesController],
  providers: [DonacionesService, PrismaService]
})
export class DonacionesModule {}
