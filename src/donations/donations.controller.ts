import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { DonationsDTO } from './donations.dto';

@Controller('donations')
export class DonationsController {

    constructor(private donationsService: DonationsService){}

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
