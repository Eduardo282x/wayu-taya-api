import { Module } from '@nestjs/common';
import { MedicinaController } from './medicina.controller';
import { MedicinaService } from './medicina.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [MedicinaController],
  providers: [MedicinaService, PrismaService]
})
export class MedicinaModule {}
