import { Body, Controller, Get, Param, Post, Put, Delete, Res, HttpException, HttpStatus } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { DonationsDTO } from './donations.dto';
import { Response } from 'express';
import { ReportsService } from 'src/reports/reports.service';

@Controller('donations')
export class DonationsController {

  constructor(private donationsService: DonationsService, private reportService: ReportsService) { }

  @Get()
  async getDonations() {
    return await this.donationsService.getDonations()
  }
  @Get('/lotes')
  async getLotes() {
    return await this.reportService.getLotes()
  }

  @Get('/download/:id')
  async downloadDonationPDF(@Param('id') id: string, @Res() res: Response) {
    const donationId = Number(id);
    if (isNaN(donationId)) {
      throw new HttpException('Invalid donation ID', HttpStatus.BAD_REQUEST);
    }

    try {
      // Llama al servicio que genera el PDF y guarda en archivo temporal o buffer
      const pdfBuffer = await this.donationsService.generateDonationPDF(donationId) as Buffer;

      // Envía el archivo generado como descarga
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=autorizacion_usodeimagen.pdf',
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
