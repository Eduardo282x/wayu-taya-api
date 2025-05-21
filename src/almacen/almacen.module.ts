import { Module } from '@nestjs/common';
import { AlmacenController } from './almacen.controller';
import { AlmacenService } from './almacen.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [AlmacenController],
  providers: [AlmacenService, PrismaService]
})
export class AlmacenModule {}
