import { Module } from '@nestjs/common';
import { DonationsController } from './donations.controller';
import { DonationsService as DonationsService } from './donations.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { ReportsModule } from 'src/reports/reports.module';

@Module({
  // ReportsService se toma de ReportsModule (no se declara aquí: duplicaría
  // la instancia y rompería la inyección de sus dependencias, como el pool de
  // workers).
  imports: [ReportsModule],
  controllers: [DonationsController],
  providers: [DonationsService, InventoryService],
})
export class DonationsModule {}
