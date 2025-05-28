import { Module } from '@nestjs/common';
import { MedicineController } from './medicine.controller';
import { MedicineService } from './medicine.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [MedicineController],
  providers: [MedicineService, PrismaService]
})
export class MedicineModule {}
