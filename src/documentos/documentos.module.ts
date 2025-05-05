import { Module } from '@nestjs/common';
import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [DocumentosController],
  providers: [DocumentosService, PrismaService]
})
export class DocumentosModule {}
