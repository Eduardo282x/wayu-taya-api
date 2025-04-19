import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ParroquiasDTO } from './parroquias.dto';
import { ParroquiasService } from './parroquias.service';

@Controller('parroquias')
export class ParroquiasController {

    constructor(private parroquiasService: ParroquiasService){

    }

    @Get()
    async getParroquias() {
        return await this.parroquiasService.getParroquia()
    }

    @Post()
    async createParroquias(@Body() datos: ParroquiasDTO) {
        return await this.parroquiasService.createParroquia(datos);
    }

    @Put('/:id')
    async updateParroquias(@Param('id') id_parroquia: string, @Body() datos: ParroquiasDTO) {
        return await this.parroquiasService.updateParroquia(Number(id_parroquia), datos)
    }

    @Delete('/:id')
    async deleteParroquias(@Param('id') id_parroquia: string){
        return await this.parroquiasService.deleteParroquia(Number(id_parroquia));
    }
}
