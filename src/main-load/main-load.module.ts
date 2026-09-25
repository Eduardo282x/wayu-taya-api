import { Module } from '@nestjs/common';
import { MainLoadController } from './main-load.controller';
import { MainLoadService } from './main-load.service';

@Module({
  controllers: [MainLoadController],
  providers: [MainLoadService],
})
export class MainLoadModule {}
