import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { MedicineService } from './medicine.service';
import { MedicineDTO } from './medicine.dto';

@Controller('medicine')
export class MedicineController {
        constructor(private medicineService: MedicineService){
    
        }
        @Get()
        async getMedicine(){
            return await this.medicineService.getMedicine()
        }
        @Post()
        async createMedicine(@Body() medicine: MedicineDTO ){
            return await this.medicineService.createMedicine(medicine);
        }
        @Put('/:id')
        async updateMedicine(@Param('id') id: string, @Body() medicine: MedicineDTO){
            return await this.medicineService.updateMedicine(Number(id), medicine);
        }
        @Delete('/:id')
        async deletemedicine(@Param('id') id: string) {
            return await this.medicineService.deletemedicine(Number(id));
        }
}
