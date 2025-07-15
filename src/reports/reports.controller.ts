import { Controller, Get, Res, Post, HttpException, HttpStatus, Body, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';
import { IInventory, ReportsDTO, SummaryReportDto, SummaryReportResponse } from './reports.dto';
import { InventoryService } from 'src/inventory/inventory.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService, private readonly inventoryService: InventoryService) { }


  @Get()
  async getFreedom() {
    return 'Well done';
  }

  @Get('/report-inventory')
  async downloadInventory(@Res() res: Response) {
    const inventory = await this.inventoryService.getInventory();
    const buffer = await this.reportsService.generateInventoryReportPDF(inventory as IInventory[]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.pdf');
    res.end(buffer);
  }

  @Get('/report-inventory/:storeId')
  async downloadInventoryByStore(@Param('storeId') storeId: string, @Res() res: Response) {
    const inventory = await this.inventoryService.getInventory();
    const buffer = await this.reportsService.generateInventoryByStorePDF(inventory as IInventory[], Number(storeId));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=inventory-store-${storeId}.pdf`);
    res.end(buffer);
  }

  @Post('/by-provider-and-lots')
  async generateCustomReport(
    @Body() body: { provider: string; lotes: string[] },
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.reportsService.generateFormattedReport(body.provider, body.lotes);

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename=donation-report.docx',
      });

      res.send(buffer);
    } catch (error) {
      console.error('Error generando el documento Word:', error);
      throw new HttpException('No se pudo generar el documento Word.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('/sample-doc')
  async downloadSampleDoc(
    @Body() body: { provider: string; lotes: string[] },
    @Res() res: Response,
  ) {
    const { provider, lotes } = body;

    if (!provider || !Array.isArray(lotes) || lotes.length === 0) {
      throw new HttpException('Parámetros inválidos: se requiere un proveedor y al menos un lote', HttpStatus.BAD_REQUEST);
    }

    try {
      const buffer = await this.reportsService.generateSampleDoc(provider, lotes);

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename=sample-report.docx',
      });

      res.send(buffer);
    } catch (error) {
      throw new HttpException(
        `Error al generar el documento: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/unified-by-provider-and-lots')
  async generateUnifiedReport(
    @Body() dto: ReportsDTO,
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.reportsService.generateUnifiedDonationReport(dto);

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename=donation-unified-report.docx',
      });

      res.send(buffer);
    } catch (error) {
      console.error('Error generando el reporte:', error);
      res.status(500).json({ message: 'No se pudo generar el documento' });
    }
  }

  @Post('/summary-report')
  async getSummaryReport(@Body() dto: SummaryReportDto): Promise<SummaryReportResponse> {
    try {
      if (new Date(dto.from) >= new Date(dto.to)) {
        throw new HttpException(
          'La fecha de inicio debe ser anterior a la fecha de fin',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.reportsService.generateSummaryReport(dto);
    } catch (error) {
      console.error(error);
      if (error instanceof HttpException) throw error;

      throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}