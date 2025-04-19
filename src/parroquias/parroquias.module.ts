import { Module } from '@nestjs/common';
import { ParroquiasController } from './parroquias.controller';
import { ParroquiasService } from './parroquias.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ParroquiasController],
  providers: [ParroquiasService,PrismaService]
})
export class ParroquiasModule {}
