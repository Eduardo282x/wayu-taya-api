import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { PersonasService } from './personas.service';
import { PersonaProgramDTO, PersonasDTO } from './personas.dto';

@Controller('people')
export class PersonasController {

    constructor(private personasService: PersonasService) {

    }

    @Get()
    async getPersonas() {
        return await this.personasService.getPersonas()
    }

    @Get('/programa/:id')
    async getPersonasByProgram(@Param('id') id: string) {
        return await this.personasService.getPersonasByProgram(Number(id))
    }

    @Post()
    async createPersonas(@Body() datos: PersonaProgramDTO) {
        return await this.personasService.createPersonas(datos);
    }

    @Post('/normal')
    async createPersonaWithoutProgram(@Body() datos: PersonasDTO) {
        return await this.personasService.createPersonaWithoutProgram(datos);
    }

    @Put('/normal/:id')
    async updatePersonasWithoutProgram(@Param('id') id_personas: string, @Body() datos: PersonasDTO) {
        return await this.personasService.updatePersonasWithoutProgram(Number(id_personas), datos);
    }

    @Put('/:id')
    async updatePersonas(@Param('id') id_personas: string, @Body() datos: PersonaProgramDTO) {
        return await this.personasService.updatePersonas(Number(id_personas), datos);
    }

    @Delete('/:id')
    async deletePersonas(@Param('id') id_personas: string) {
        return await this.personasService.deletePersonas(Number(id_personas));
    }


}
