import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { InstitutionsService } from './institutions.service';
import { InstitutionsDTO } from './institutions.dto';

@Controller('institutions')
export class InstitutionsController {

    constructor (private institutionsService: InstitutionsService){}

    @Get()
    async getInstitutions() {
        return await this.institutionsService.getInstitutions();
    }

    @Post()
    async createInstitutions(@Body() datos: InstitutionsDTO) {
        return await this.institutionsService.createInstitutions(datos);
    }

    @Put('/:id')
    async updateInstitutions(@Param('id') id_institution:string, @Body() datos: InstitutionsDTO) {
        return await this.institutionsService.updateInstitutions(Number(id_institution),datos);
    }

    @Delete('/:id')
    async deleteProveedores(@Param('id') id_institution: string) {
        return await this.institutionsService.deleteInstitutions(Number(id_institution));
    }
}
