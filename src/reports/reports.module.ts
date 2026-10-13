import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportWorkerPool } from './report-worker/report-worker-pool.service';
import { InventoryService } from 'src/inventory/inventory.service';

// PrismaService viene de PrismaModule, que es @Global: no hace falta
// importarlo ni declararlo aqui.
@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportWorkerPool, InventoryService],
  exports: [ReportsService],
})
export class ReportsModule {}
