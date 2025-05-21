import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MedicinaDTO } from './medicina.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class MedicinaService {

    constructor(private prismaService: PrismaService) {

    }
    async getMedicine() {
        return await this.prismaService.medicine.findMany({
            include: {
                category: true,
                form: true
            }
        });
    }

    async createMedicine(medicine: MedicinaDTO) {
        try {
            await this.prismaService.medicine.create({
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
                    formId: medicine.formId,
                }
            });
            baseResponse.message = 'Medicina creado exitosamente.'
            return baseResponse;
        } catch (err) {
            badResponse.message = 'Error al crear el Medicina.' + err
            return badResponse;
        }
    }

    async updateMedicine(id: number, medicine: MedicinaDTO) {
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
                    formId: medicine.formId,
                },
                where: { id: id }
            });

            baseResponse.message = 'exito al actualizar la Medicina.'
            return baseResponse;
        } catch (err) {
            badResponse.message = 'Error al actualizar la Medicina.' + err
            return badResponse;
        }

    }

}
