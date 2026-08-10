import { Module } from '@nestjs/common';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ProgramsController],
  providers: [ProgramsService, PrismaService],
})
export class ProgramsModule {}
