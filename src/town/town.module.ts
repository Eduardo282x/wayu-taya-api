import { Module } from '@nestjs/common';
import { CiudadesController } from './town.controller';
import { TownService } from './town.service';

@Module({
  controllers: [CiudadesController],
  providers: [TownService],
})
export class CiudadesModule {}
