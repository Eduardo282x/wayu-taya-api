import { Module } from '@nestjs/common';
import { ProgramasController } from './programas.controller';
import { ProgramasService } from './programas.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ProgramasController],
  providers: [ProgramasService, PrismaService]
})
export class ProgramasModule {}
