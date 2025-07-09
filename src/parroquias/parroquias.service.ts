import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ParroquiasDTO } from './parroquias.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class ParroquiasService {

    constructor(private prismaService: PrismaService) {

    }

    async getParroquia() {
        return await this.prismaService.parish.findMany({
            include: { town: { include: { city: { include: { state: true } } } } }
        });
    }

    async createParroquia(parroquia: ParroquiasDTO) {
        try {
            await this.prismaService.parish.create({
                data: {
                    name: parroquia.parroquia,
                    townId: parroquia.id_ciudad
                }
            })
            baseResponse.message = 'Parroquia creada exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al crear la Parroquia.' + error
            return badResponse;
        }
    }

    async updateParroquia(id_parroquia: number, parroquia: ParroquiasDTO) {
        try {
            await this.prismaService.parish.update({
                data: { name: parroquia.parroquia },
                where: { id: id_parroquia }
            })
            baseResponse.message = 'Parroquia actualizada exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al actualizar la Parroquia.' + error
            return badResponse;
        }
    }

    async deleteParroquia(id_parroquia: number) {
        try {
            await this.prismaService.parish.delete({
                where: { id: id_parroquia }
            })
            baseResponse.message = 'Parroquia eliminada exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al eliminar la parroquia: ' + error
            return badResponse;
        }
    }
}
