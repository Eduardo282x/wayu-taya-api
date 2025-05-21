import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { TownDTO } from './town.dto';
import { TownService } from './town.service';

@Controller('ciudades')
export class CiudadesController {

    constructor(private townService: TownService) {
    }

    @Get()
    async getCiudades() {
        return await this.townService.getTown()
    }

    @Post()
    async createCiudad(@Body() datos: TownDTO) {
        return await this.townService.createCiudad(datos);
    }

    @Put('/:id')
    async updateCiudad(@Param('id') id_ciudad: string, @Body() datos: TownDTO) {
        return await this.townService.updateCiudad(Number(id_ciudad), datos);
    
    }

    @Delete('/:id')
    async deleteCiudad(@Param('id') id_ciudad: string) {
        return await this.townService.deleteCiudad(Number(id_ciudad));
    }


}
