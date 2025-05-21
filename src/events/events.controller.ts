import { Body, Controller, Delete, Get, Param, Post, Put} from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsDTO } from './events.dto'

@Controller('events')
export class EventsController {

    constructor(private eventsService: EventsService){}

    @Get()
    async getEvents() {
        return await this.eventsService.getEvents()
    }

    @Get('/fixed')
    async getEventsFixed() {
        return await this.eventsService.getEventsFixed()
    }

    @Post()
    async createEvent(@Body() datos: EventsDTO) {
        return await this.eventsService.createEvent(datos);
    }

    @Put('/:id')
    async updateEvent(@Param('id') id_evento:string, @Body() datos: EventsDTO) {
        return await this.eventsService.updateEvent(Number(id_evento),datos);
    }

    @Delete('/:id')
    async deleteEvent(@Param('id') id_evento: string) {
        return await this.eventsService.deleteEvent(Number(id_evento));
    }




}
