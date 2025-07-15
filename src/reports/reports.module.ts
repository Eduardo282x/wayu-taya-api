import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { InventoryService } from 'src/inventory/inventory.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, PrismaService, InventoryService],
  exports: [ReportsService]
})
export class ReportsModule {}
