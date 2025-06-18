import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MedicineDTO, MedicineFormatExcel } from './medicine.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';
import * as XLSX from 'xlsx';
import { Response } from 'express';

@Injectable()
export class MedicineService {

    constructor(private prismaService: PrismaService) {

    }
    async getMedicine() {
        return await this.prismaService.medicine.findMany({
            include: {
                category: true,
                form: true,
            }
        });
    }
    async createMedicine(medicine: MedicineDTO) {
        try {
            await this.prismaService.medicine.create({
                data: {
                    name: medicine.name,
                    description: medicine.description,
                    categoryId: medicine.categoryId,
                    medicine: medicine.medicine,
                    unit: medicine.unit ? medicine.unit : '',
                    amount: medicine.amount ? medicine.amount : 0,
                    temperate: medicine.temperate ? medicine.temperate : '',
                    manufacturer: medicine.manufacturer ? medicine.manufacturer : '',
                    activeIngredient: medicine.activeIngredient ? medicine.activeIngredient : '',
                    countryOfOrigin: medicine.countryOfOrigin ? medicine.countryOfOrigin : '',
                    formId: medicine.formId ? medicine.formId : 14,
                }
            });
            baseResponse.message = 'Medicina creado exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'error al crear el Medicina.' + error
            return badResponse;
        }
    }
    async updateMedicine(id: number, medicine: MedicineDTO) {
        try {
            await this.prismaService.medicine.update({
                data: {
                    name: medicine.name,
                    description: medicine.description,
                    categoryId: medicine.categoryId,
                    medicine: medicine.medicine,
                    unit: medicine.unit,
                    amount: medicine.amount,
                    temperate: medicine.temperate,
                    manufacturer: medicine.manufacturer,
                    activeIngredient: medicine.activeIngredient,
                    countryOfOrigin: medicine.countryOfOrigin,
                    formId: medicine.formId,
                },
                where: { id: id }
            });

            baseResponse.message = 'exito al actualizar la Medicina.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al actualizar la Medicina.' + error
            return badResponse;
        }
    }
    async deleteMedicine(id: number) {
        try {
            await this.prismaService.medicine.delete({
                where: { id: id }
            })

            baseResponse.message = 'Medicina/Producto eliminado exitosamente';
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al eliminar la Medicina/Producto.' + error
            return badResponse;
        }
    }

    async downloadExcelTemplate(res: Response) {
        const headers = [
            "name", "description", "categoryId", "medicine", "unit",
            "amount", "temperate", "manufacturer", "activeIngredient",
            "countryOfOrigin", "formId"
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        XLSX.utils.book_append_sheet(wb, ws, 'Medicinas');

        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="medicine_template.xlsx"');
        res.send(buffer);
    }

    async uploadExcel(file: Express.Multer.File) {
        try {
            const categoriesDB = await this.prismaService.category.findMany();
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawData: MedicineFormatExcel[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

            const medicineAndProducts = rawData.map((data: MedicineFormatExcel) => {
                const findCategory = categoriesDB.find(item => item.category.toLowerCase().trim().includes(data.categoryId.toLowerCase().trim()))
                console.log(findCategory);

                return {
                    ...data
                };
            })

            // console.log(medicineAndProducts);
            baseResponse.data = medicineAndProducts
            baseResponse.message = 'Medicinas cargadas exitosamente.';
            return baseResponse;

        } catch (error) {
            badResponse.message = 'Error al cargar las medicinas desde Excel: ' + error;
            return badResponse;
        }
    }

}
