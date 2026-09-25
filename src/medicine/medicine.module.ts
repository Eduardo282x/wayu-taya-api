import { Module } from '@nestjs/common';
import { MedicineController } from './medicine.controller';
import { MedicineService } from './medicine.service';

@Module({
  controllers: [MedicineController],
  providers: [MedicineService],
})
export class MedicineModule {}
