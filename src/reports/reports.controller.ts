import { Controller, Get, Res ,Post, HttpException, HttpStatus, Body} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }


  @Get()
  async getFreedom() {
    return 'Well done';
  }
  /*
  @Get('/test')
  async getDocument(@Res() res: Response) {
    const buffer = await this.reportsService.generateCenteredTextDoc();

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="documento.docx"',
    });

    res.send(buffer);
  }

  @Get('/personas-test')
  async downloadPersonReport(@Res() res: Response) {
    const buffer = await this.reportsService.generatePersonReport();

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename=personas.docx',
    });

    res.send(buffer);
  }

  @Get('/brusco-test')
  async getTemplate(@Res() res: Response) {
    const buffer = await this.reportsService.generateDonationReportTemplate();

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="plantilla-reporte.docx"',
    });

  res.send(buffer);
}
/*
@Post('by-provider-and-lots')
  async generateCustomReport(
    @Body() body: { provider: string; lotes: string[] },
    @Res() res: Response
  ) {
    try {
      const buffer = await this.reportsService.generateReportByProviderAndLots(
        body.provider,
        body.lotes
      );

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename=donation-report.docx',
      });

      res.send(buffer);
    } catch (error) {
      console.error('Error generando el reporte:', error);
      throw new HttpException('No se pudo generar el reporte.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }*/

  @Post('by-provider-and-lots')
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

  @Post('sample-doc')
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

  @Post('unified-by-provider-and-lots')
  async generateUnifiedReport(
    @Body() body: { provider: string; lotes: string[] },
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.reportsService.generateUnifiedDonationReport(body.provider, body.lotes);

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

  
}