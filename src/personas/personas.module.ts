import { Module } from '@nestjs/common';
import { PersonasController } from './personas.controller';
import { PersonasService } from './personas.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [PersonasController],
  providers: [PersonasService, PrismaService]
})
export class PersonasModule {}
