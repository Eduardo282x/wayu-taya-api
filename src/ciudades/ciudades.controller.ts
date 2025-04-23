import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CiudadesService } from './ciudades.service';
import { CiudadDTO } from './ciudades.dto';

@Controller('ciudades')
export class CiudadesController {

    constructor(private ciudadService: CiudadesService) {
    }

    @Get()
    async getCiudades() {
        return await this.ciudadService.getCiudades()
    }

    @Post()
    async createCiudad(@Body() datos: CiudadDTO) {
        return await this.ciudadService.createCiudad(datos);
    }

    @Put('/:id')
    async updateCiudad(@Param('id') id_ciudad: string, @Body() datos: CiudadDTO) {
        return await this.ciudadService.updateCiudad(Number(id_ciudad), datos);
    
    }

    @Delete('/:id')
    async deleteCiudad(@Param('id') id_ciudad: string) {
        return await this.ciudadService.deleteCiudad(Number(id_ciudad));
    }


}
