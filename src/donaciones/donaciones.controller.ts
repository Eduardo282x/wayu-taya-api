import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { DonacionesService } from './donaciones.service';
import { DonationsDTO } from './donaciones.dto';

@Controller('donations')
export class DonacionesController {

    constructor(private donationsService: DonacionesService){}

    @Get()
    async getDonations() {
        return await this.donationsService.getDonations()
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
