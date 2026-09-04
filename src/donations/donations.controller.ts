import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Query,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DonationsService } from './donations.service';
import { DonationsDTO, GetDonationsQueryDTO } from './donations.dto';
import { Response } from 'express';
import { ReportsService } from 'src/reports/reports.service';

@Controller('donations')
export class DonationsController {
  constructor(
    private donationsService: DonationsService,
    private reportService: ReportsService,
  ) {}

  @Get()
  async getDonations(@Query() query: GetDonationsQueryDTO) {
    return await this.donationsService.getDonations(query);
  }
  @Get('/lotes')
  async getLotes() {
    return await this.reportService.getLotes();
  }

  @Get('/template')
  async downloadDonationTemplate(@Res() res: Response) {
    return await this.donationsService.downloadDonationExcelTemplate(res);
  }

  @Get('/download/:id')
  async downloadDonationPDF(@Param('id') id: string, @Res() res: Response) {
    const donationId = Number(id);
    if (isNaN(donationId)) {
      throw new HttpException('Invalid donation ID', HttpStatus.BAD_REQUEST);
    }

    try {
      // Llama al servicio que genera el PDF y guarda en archivo temporal o buffer
      const pdfBuffer = (await this.donationsService.generateDonationPDF(
        donationId,
        'normal'
      )) as Buffer;

      // Envía el archivo generado como descarga
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          `attachment; filename=factura_no_comercial_${donationId}.pdf`,
        'Content-Length': pdfBuffer.length,
      });

      res.end(pdfBuffer);
    } catch (error) {
      console.error('Error generando PDF:', error);
      res.status(500).send('Error generando PDF');
    }
  }

  @Get('/note-delivery/:id')
  async downloadNoteDeliveryDonationPDF(@Param('id') id: string, @Res() res: Response) {
    const donationId = Number(id);
    if (isNaN(donationId)) {
      throw new HttpException('Invalid donation ID', HttpStatus.BAD_REQUEST);
    }

    try {
      // Llama al servicio que genera el PDF y guarda en archivo temporal o buffer
      const pdfBuffer = (await this.donationsService.generateDonationPDF(
        donationId,
        'delivery'
      )) as Buffer;

      // Envía el archivo generado como descarga
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          `attachment; filename=nota_de_entrega_${donationId}.pdf`,
        'Content-Length': pdfBuffer.length,
      });

      res.end(pdfBuffer);
    } catch (error) {
      console.error('Error generando PDF:', error);
      res.status(500).send('Error generando PDF');
    }
  }

  @Post()
  async createDonations(@Body() data: DonationsDTO) {
    return await this.donationsService.createDonation(data);
  }

  @Put('/:id')
  async updateDonations(@Param('id') id: string, @Body() data: DonationsDTO) {
    return await this.donationsService.updateDonation(Number(id), data);
  }

  @Delete(':id')
  async deleteDonation(@Param('id') id: string) {
    return await this.donationsService.deleteDonation(Number(id));
  }
}
