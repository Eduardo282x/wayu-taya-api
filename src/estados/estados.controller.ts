import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { EstadosService } from './estados.service';
import { EstadoDTO } from './estados.dto';

@Controller('estados')
export class EstadosController {

    constructor(private estadoService: EstadosService) {

    }

    @Get()
    async getEstados() {
        return await this.estadoService.getEstados()
    }

    @Post()
    async createEstado(@Body() datos: EstadoDTO) {
        return await this.estadoService.createEstado(datos);
    }

    @Put('/:id')
    async updateEstado(@Param('id') id_estado: string, @Body() datos: EstadoDTO) {
        return await this.estadoService.updateEstado(Number(id_estado), datos);
    }

    @Delete('/:id')
    async deleteEstado(@Param('id') id_estado: string) {
        return await this.estadoService.deleteEstado(Number(id_estado));
    }
}
