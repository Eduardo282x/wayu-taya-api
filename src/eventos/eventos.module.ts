import { Module } from '@nestjs/common';
import { EventosController } from './eventos.controller';
import { EventosService } from './eventos.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [EventosController],
  providers: [EventosService, PrismaService]
})
export class EventosModule {}
