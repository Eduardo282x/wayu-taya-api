import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { InventoryService } from 'src/inventory/inventory.service';

// PrismaService viene de PrismaModule, que es @Global: no hace falta
// importarlo ni declararlo aqui.
@Module({
  controllers: [ReportsController],
  providers: [ReportsService, InventoryService],
  exports: [ReportsService],
})
export class ReportsModule {}
