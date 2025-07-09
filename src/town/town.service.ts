import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TownDTO } from './town.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class TownService {

    constructor(private prismaService: PrismaService) {
    }

    async getTown() {
        return await this.prismaService.town.findMany({
            include: {
                city: true
            }
        });
    }

    async createCiudad(ciudad: TownDTO) {
        try {
            await this.prismaService.town.create({
                data: {
                    name: ciudad.town,
                    cityId: ciudad.id_municipio
                }
            })
            baseResponse.message = 'Ciudad creada exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al crear la ciudad.' + error
            return badResponse;
        }
    }

    async updateCiudad(id_ciudad: number, ciudad: TownDTO) {
        try {
            await this.prismaService.town.update({
                data: {
                    name: ciudad.town,
                    cityId: ciudad.id_municipio
                },
                where: { id: id_ciudad }
            })
            baseResponse.message = 'Ciudad actualizada exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al actualizar la ciudad.' + error
            return badResponse;
        }
    }

    async deleteCiudad(id_ciudad: number) {
        try {
            await this.prismaService.town.delete({
                where: { id: id_ciudad }
            })
            baseResponse.message = 'Ciudad eliminada exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al eliminar la ciudad.' + error
            return badResponse;
        }
    }

}
