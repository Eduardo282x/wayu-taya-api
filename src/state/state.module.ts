import { Module } from '@nestjs/common';
import { EstadosController } from './state.controller';
import { StateService } from './state.service';

@Module({
  controllers: [EstadosController],
  providers: [StateService],
})
export class EstadosModule {}
