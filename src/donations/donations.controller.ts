import { Body, Controller, Get, Param, Post, Put, Res, HttpException, HttpStatus } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { DonationsDTO } from './donations.dto';
import { Response } from 'express';

@Controller('donations')
export class DonationsController {

  constructor(private donationsService: DonationsService) { }

  @Get()
  async getDonations() {
    return await this.donationsService.getDonations()
  }

  @Get('/download/:id')
  async downloadDonationPDF(@Param('id') id: string, @Res() res: Response) {
    const donationId = Number(id);
    if (isNaN(donationId)) {
      throw new HttpException('Invalid donation ID', HttpStatus.BAD_REQUEST);
    }

    try {
      // Llama al servicio que genera el PDF y guarda en archivo temporal o buffer
      const filePath = `./donacion_${donationId}.pdf`;
      const buffer = await this.donationsService.generateDonationPDF(donationId, filePath) as Buffer;

      // Envía el archivo generado como descarga
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=donacion_${donationId}.pdf`,
        'Content-Length': buffer.length,
      });

      // res.sendFile(filePath);
      res.end(buffer);
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
}
