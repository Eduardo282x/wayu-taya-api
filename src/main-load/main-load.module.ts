import { Module } from '@nestjs/common';
import { MainLoadController } from './main-load.controller';
import { MainLoadService } from './main-load.service';
import {PrismaService} from 'src/prisma/prisma.service';

@Module({
  controllers: [MainLoadController],
  providers: [MainLoadService, PrismaService]
})
export class MainLoadModule {}
