import { Module } from '@nestjs/common';
import { ParroquiasController } from './parroquias.controller';
import { ParroquiasService } from './parroquias.service';

@Module({
  controllers: [ParroquiasController],
  providers: [ParroquiasService],
})
export class ParroquiasModule {}
