import { Body, Controller, Delete, Get, Param, Post, Put, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { MedicineService } from './medicine.service';
import { MedicineDTO } from './medicine.dto';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('medicine')
export class MedicineController {

    constructor(private medicineService: MedicineService) {
    }

    @Get()
    async getMedicine() {
        return await this.medicineService.getMedicine()
    }
    // Servicio para descargar el formato Excel
    @Get('/template')
    async downloadTemplate(@Res() res: Response) {
        return this.medicineService.downloadExcelTemplate(res);
    }

    @Post()
    async createMedicine(@Body() medicine: MedicineDTO) {
        return await this.medicineService.createMedicine(medicine);
    }
    // Servicio para carga masiva de productos/medicinas con Excel
    @Post('/upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        return this.medicineService.uploadExcel(file);
    }
    @Put('/:id')
    async updateMedicine(@Param('id') id: string, @Body() medicine: MedicineDTO) {
        return await this.medicineService.updateMedicine(Number(id), medicine);
    }
    @Delete('/:id')
    async deletemedicine(@Param('id') id: string) {
        return await this.medicineService.deleteMedicine(Number(id));
    }
}
