import { Module } from '@nestjs/common';
import { DonacionesController } from './donaciones.controller';
import { DonacionesService } from './donaciones.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { InventoryService } from 'src/inventory/inventory.service';

@Module({
  controllers: [DonacionesController],
  providers: [DonacionesService, PrismaService, InventoryService]
})
export class DonacionesModule {}
