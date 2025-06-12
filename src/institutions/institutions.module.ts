import { Module } from '@nestjs/common';
import { InstitutionsController } from './institutions.controller';
import { InstitutionsService } from './institutions.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [InstitutionsController],
  providers: [InstitutionsService, PrismaService]
})
export class InstitutionsModule {}
