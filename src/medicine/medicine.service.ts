import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MedicineDTO } from './medicine.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

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
            badResponse.message = 'erroror al crear el Medicina.' + error
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
}
