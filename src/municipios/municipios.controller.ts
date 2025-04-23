import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { MunicipiosService } from './municipios.service';
import { MunicipioDTO } from './municipios.dto';

@Controller('municipios')
export class MunicipiosController {

    constructor(private municipiosService: MunicipiosService) {
    }

    @Get()
    async getMunicipios() {
        return await this.municipiosService.getMunicipios()
    }

    @Post()
    async createMunicipio(@Body() datos: MunicipioDTO) {
        return await this.municipiosService.createMunicipio(datos);
    }

    @Put('/:id')
    async updateMunicipio(@Param('id') id_municipio: string, @Body() datos: MunicipioDTO) {
        return await this.municipiosService.updateMunicipio(Number(id_municipio), datos);
    }

    @Delete('/:id')
    async deleteMunicipio(@Param('id') id_municipio: string) {
        return await this.municipiosService.deleteMunicipio(Number(id_municipio));
    }
}
