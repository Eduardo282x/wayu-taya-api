import { Controller, Get, Res ,Post, HttpException, HttpStatus, Body} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}


  @Get()
  async getFreedom() {
    return 'Well done';
  }
  @Get('/test')
  async getDocument(@Res() res: Response) {
    const buffer = await this.reportsService.generateCenteredTextDoc();

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="documento.docx"',
    });

    res.send(buffer);
  }

  @Get('personastest')
async downloadPersonReport(@Res() res: Response) {
  const buffer = await this.reportsService.generatePersonReport();

  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Content-Disposition': 'attachment; filename=personas.docx',
  });

  res.send(buffer);
}

@Get('bruscotest')
async getTemplate(@Res() res: Response) {
  const buffer = await this.reportsService.generateDonationReportTemplate();

  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Content-Disposition': 'attachment; filename="plantilla-reporte.docx"',
  });

  res.send(buffer);
}

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
  }
}