import { Body, Controller, Delete, Get, Param, Post, Put} from '@nestjs/common';
import { EventosService } from './eventos.service';
import { EventosDTO } from './eventos.dto'

@Controller('eventos')
export class EventosController {

    constructor(private eventosService: EventosService){}

    @Get()
    async getEventos() {
        return await this.eventosService.getEventos()
    }

    @Post()
    async createEvento(@Body() datos: EventosDTO) {
        return await this.eventosService.createEvento(datos);
    }

    @Put('/:id')
    async updateEvento(@Param('id') id_evento:string, @Body() datos: EventosDTO) {
        return await this.eventosService.updateEvento(Number(id_evento),datos);
    }

    @Delete('/:id')
    async deleteEvento(@Param('id') id_evento: string) {
        return await this.eventosService.deleteEvento(Number(id_evento));
    }




}
