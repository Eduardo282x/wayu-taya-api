import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { MedicinaService } from './medicina.service';
import { MedicinaDTO } from './medicina.dto';

@Controller('medicina')
export class MedicinaController {
        constructor(private medicinaService: MedicinaService){
    
        }
        @Get()
        async getMedicine(){
            return await this.medicinaService.getMedicine()
        }
        @Post()
        async createMedicine(@Body() medicina: MedicinaDTO ){
            return await this.medicinaService.createMedicine(medicina);
        }
        @Put('/:id')
        async updateMedicine(@Param('id') id: string, @Body() medicina: MedicinaDTO){
            return await this.medicinaService.updateMedicine(Number(id), medicina);
        }
}
