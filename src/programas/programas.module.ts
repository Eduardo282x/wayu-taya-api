import { Module } from '@nestjs/common';
import { ProgramasController } from './programas.controller';
import { ProgramsService } from './programas.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ProgramasController],
  providers: [ProgramsService, PrismaService]
})
export class ProgramasModule {}
