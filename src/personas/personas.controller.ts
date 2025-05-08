import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { PersonasService } from './personas.service';
import { PersonasDTO } from './personas.dto';

@Controller('personas')
export class PersonasController {

    constructor(private personasService: PersonasService){

    }

    @Get()
    async getPersonas(){
        return await this.personasService.getPersonas()   
    }

    @Post()
    async createPersonas(@Body() datos: PersonasDTO) {
        return await this.personasService.createPersonas(datos);
    }

    @Put('/:id')
    async updatePersonas(@Param('id') id_personas:string, @Body() datos: PersonasDTO){
        return await this.personasService.updatePersonas(Number(id_personas),datos);
    }

    @Delete('/:id')
    async deletePersonas(@Param('id') id_personas: string){
        return await this.personasService.deletePersonas(Number(id_personas));
    }


}
