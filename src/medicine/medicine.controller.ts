import { Body, Controller, Delete, Get, Param, Post, Put, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { MedicineService } from './medicine.service';
import { CategoryDTO, FormsDTO, MedicineDTO } from './medicine.dto';
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
    //categoria
    @Get("/category")
    async getCategory() {
        return await this.medicineService.getCategory()
    }
    //formas 
    @Get("/forms")
    async getForms() {
        return await this.medicineService.getForms()
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
    //categoria crear
    @Post("/category")
    async craeteCategory(@Body() category: CategoryDTO) {
        return await this.medicineService.createCategory(category);
    }
    //formas crear
    @Post("/forms")
    async createForms(@Body() forms: FormsDTO) {
        return await this.medicineService.createForms(forms);
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
    //categoria cambiar
    @Put('/category/:id')
    async updateCategory(@Param('id') id: string, @Body() category: CategoryDTO) {
        return await this.medicineService.updateCategory(Number(id), category);
    }
    //formas cambiar
    @Put('/forms/:id')
    async updateForms(@Param('id') id: string, @Body() forms: FormsDTO) {
        return await this.medicineService.updateForms(Number(id), forms);
    }
    @Delete('/:id')
    async deleteMedicine(@Param('id') id: string) {
        return await this.medicineService.deleteMedicine(Number(id));
    }
    //categoria eliminar
    @Delete('/category/:id')
    async deleteCategory(@Param('id') id: string) {
        return await this.medicineService.deleteCategory(Number(id));
    }
    //forma eliminar
    @Delete('/forms/:id')
    async deleteForms(@Param('id') id: string) {
        return await this.medicineService.deleteForms(Number(id));
    }

}
