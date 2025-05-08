import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ProgramasService } from './programas.service';
import { ProgramasDTO } from './programas.dto';

@Controller('programas')
export class ProgramasController {

    constructor(private programasService: ProgramasService){

    }
    @Get()
    async getProgramas(){
        return await this.programasService.getProgramas()
    }
    
    @Post()
    async createProgramas(@Body() datos: ProgramasDTO){
        return await this.programasService.createProgramas(datos);
    }

    @Put('/:id')
    async updateProgramas(@Param('id') id_programas: string, @Body() datos: ProgramasDTO){
        return await this.programasService.updateProgramas(Number(id_programas),datos);
    }

    @Delete('/:id')
    async deleteProgramas(@Param('id') id_programas: string){
        return await this.programasService.deleteProgramas(Number(id_programas));
    }

}
