import { Module } from '@nestjs/common';
import { DonationsController } from './donations.controller';
import { DonationsService as DonationsService } from './donations.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { ReportsService } from 'src/reports/reports.service';

@Module({
  controllers: [DonationsController],
  providers: [DonationsService, InventoryService, ReportsService],
})
export class DonationsModule {}
