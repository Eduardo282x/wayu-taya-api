import {
  Controller,
  Get,
  Post,
  HttpException,
  HttpStatus,
  Body,
  Param,
  StreamableFile,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Throttle } from '@nestjs/throttler';
import {
  IInventory,
  ReportsDTO,
  SummaryReportDto,
  SummaryReportResponse,
} from './reports.dto';
import { InventoryService } from 'src/inventory/inventory.service';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly inventoryService: InventoryService,
  ) {}

  @Get()
  getFreedom() {
    return 'Well done';
  }

  /**
   * Los reportes generan PDF/DOCX de forma intensiva en CPU. La generación se
   * delega a `ReportWorkerPool` (worker_threads) para no bloquear el event
   * loop; `@Throttle` queda como segunda barrera.
   */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Get('/report-inventory')
  async downloadInventory(): Promise<StreamableFile> {
    const inventory = await this.inventoryService.getInventory();
    const buffer = await this.reportsService.generateInventoryReportPDF(
      inventory.inventory as unknown as IInventory[],
    );

    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: 'attachment; filename=inventory-report.pdf',
    });
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Get('/report-inventory/:storeId')
  async downloadInventoryByStore(
    @Param('storeId') storeId: string,
  ): Promise<StreamableFile> {
    const inventory = await this.inventoryService.getInventory();
    const buffer = await this.reportsService.generateInventoryByStorePDF(
      inventory.inventory as unknown as IInventory[],
      Number(storeId),
    );

    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename=inventory-store-${storeId}.pdf`,
    });
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('/by-provider-and-lots')
  async generateCustomReport(@Body() dto: ReportsDTO): Promise<StreamableFile> {
    const buffer = await this.reportsService.generateFormattedReport(dto);

    return new StreamableFile(buffer, {
      type: DOCX_MIME,
      disposition: 'attachment; filename=donation-report.docx',
    });
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('/sample-doc')
  async downloadSampleDoc(@Body() dto: ReportsDTO): Promise<StreamableFile> {
    if (!dto.provider || !Array.isArray(dto.lotes) || dto.lotes.length === 0) {
      throw new HttpException(
        'Parámetros inválidos: se requiere un proveedor y al menos un lote',
        HttpStatus.BAD_REQUEST,
      );
    }

    const buffer = await this.reportsService.generateSampleDoc(dto);

    return new StreamableFile(buffer, {
      type: DOCX_MIME,
      disposition: 'attachment; filename=sample-report.docx',
    });
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('/unified-by-provider-and-lots')
  async generateUnifiedReport(
    @Body() dto: ReportsDTO,
  ): Promise<StreamableFile> {
    const buffer = await this.reportsService.generateUnifiedDonationReport(dto);

    return new StreamableFile(buffer, {
      type: DOCX_MIME,
      disposition: 'attachment; filename=donation-unified-report.docx',
    });
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('/summary-report')
  async getSummaryReport(
    @Body() dto: SummaryReportDto,
  ): Promise<SummaryReportResponse> {
    if (new Date(dto.from) >= new Date(dto.to)) {
      throw new HttpException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.reportsService.generateSummaryReport(dto);
  }
}
