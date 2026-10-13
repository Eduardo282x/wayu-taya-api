import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Query,
  StreamableFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DonationsService } from './donations.service';
import { DonationsDTO, GetDonationsQueryDTO } from './donations.dto';
import { ReportsService } from 'src/reports/reports.service';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

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
  async downloadDonationTemplate(): Promise<StreamableFile> {
    const buffer = await this.donationsService.downloadDonationExcelTemplate();
    return new StreamableFile(buffer, {
      type: XLSX_MIME,
      disposition: 'attachment; filename="donacion_plantilla.xlsx"',
    });
  }

  @Get('/download/:id')
  async downloadDonationPDF(@Param('id') id: string): Promise<StreamableFile> {
    const donationId = Number(id);
    if (isNaN(donationId)) {
      throw new HttpException('Invalid donation ID', HttpStatus.BAD_REQUEST);
    }

    const pdfBuffer = (await this.donationsService.generateDonationPDF(
      donationId,
      'normal',
    )) as Buffer;

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename=factura_no_comercial_${donationId}.pdf`,
    });
  }

  @Get('/note-delivery/:id')
  async downloadNoteDeliveryDonationPDF(
    @Param('id') id: string,
  ): Promise<StreamableFile> {
    const donationId = Number(id);
    if (isNaN(donationId)) {
      throw new HttpException('Invalid donation ID', HttpStatus.BAD_REQUEST);
    }

    const pdfBuffer = (await this.donationsService.generateDonationPDF(
      donationId,
      'delivery',
    )) as Buffer;

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename=nota_de_entrega_${donationId}.pdf`,
    });
  }

  @Get('/certificate/:id')
  async downloadCertificateDonationPDF(
    @Param('id') id: string,
  ): Promise<StreamableFile> {
    const donationId = Number(id);
    if (isNaN(donationId)) {
      throw new HttpException('Invalid donation ID', HttpStatus.BAD_REQUEST);
    }

    const pdfBuffer =
      (await this.donationsService.downloadCertificateDonationPDF(
        donationId,
      )) as Buffer;

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename=certificado_de_donacion_${donationId}.pdf`,
    });
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
