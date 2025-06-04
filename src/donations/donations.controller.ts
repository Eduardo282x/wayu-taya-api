import { Body, Controller, Get, Param, Post, Put, Res, HttpException, HttpStatus } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { DonationsDTO } from './donations.dto';
import { Response } from 'express';

@Controller('donations')
export class DonationsController {

    constructor(private donationsService: DonationsService){}

    @Get()
    async getDonations() {
        return await this.donationsService.getDonations()
    }

    @Get('pdf/:id')
    // Si quieres usar esto tiene que ser en postman y darle a enviar y descargar respuesta
  async downloadDonationPDF(@Param('id') id: string, @Res() res: Response) {
    const donationId = Number(id);
    if (isNaN(donationId)) {
      throw new HttpException('Invalid donation ID', HttpStatus.BAD_REQUEST);
    }

    try {
      // Llama al servicio que genera el PDF y guarda en archivo temporal o buffer
      const filePath = `./donacion_${donationId}.pdf`;
      await this.donationsService.generateDonationPDF(donationId, filePath);

      // Envía el archivo generado como descarga
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=donacion_${donationId}.pdf`,
      });

      res.sendFile(filePath, { root: '.' }, (err) => {
        if (err) {
          console.error('Error enviando archivo PDF:', err);
          res.status(500).send('Error enviando PDF');
        }
        // Opcional: eliminar archivo si es temporal
        // fs.unlinkSync(filePath);
      });
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
