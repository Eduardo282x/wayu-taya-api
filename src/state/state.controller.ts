import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { StateService } from './state.service';
import { StateDTO } from './state.dto';

@Controller('state')
export class EstadosController {

    constructor(private stateService: StateService) {

    }

    @Get()
    async getState() {
        return await this.stateService.getState()
    }

    @Post()
    async createState(@Body() datos: StateDTO) {
        return await this.stateService.createState(datos);
    }

    @Put('/:id')
    async updateState(@Param('id') id_estado: string, @Body() datos: StateDTO) {
        return await this.stateService.updateState(Number(id_estado), datos);
    }

    @Delete('/:id')
    async deleteState(@Param('id') id_estado: string) {
        return await this.stateService.deleteState(Number(id_estado));
    }
}
