import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { DonacionesService } from './donaciones.service';
import { DonacionesDTO } from './donaciones.dto';

@Controller('donations')
export class DonacionesController {

    constructor(private donationsService: DonacionesService){}

    @Get()
    async getDonations() {
        return await this.donationsService.getDonations()
    }

    @Post()
    async createDonations(@Body() datos: DonacionesDTO) {
        return await this.donationsService.createDonation(datos);
    }
}
