import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ProgramsService } from './programas.service';
import { ProgramsDTO } from './programs.dto';

@Controller('programas')
export class ProgramasController {

    constructor(private programasService: ProgramsService){

    }
    @Get()
    async getProgramas(){
        return await this.programasService.getPrograms()
    }
    
    @Post()
    async createProgramas(@Body() datos: ProgramsDTO){
        return await this.programasService.createPrograms(datos);
    }

    @Put('/:id')
    async updateProgramas(@Param('id') id_programas: string, @Body() datos: ProgramsDTO){
        return await this.programasService.updatePrograms(Number(id_programas),datos);
    }

    @Delete('/:id')
    async deleteProgramas(@Param('id') id_programas: string){
        return await this.programasService.deletePrograms(Number(id_programas));
    }

}
