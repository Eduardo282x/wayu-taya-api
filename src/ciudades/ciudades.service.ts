import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CiudadDTO } from './ciudades.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class CiudadesService {

    constructor(private prismaService: PrismaService) {
    }

    async getCiudades() {
        return await this.prismaService.ciudades.findMany({
            include: {
                municipio: true
            }
        });
    }

    async createCiudad(ciudad: CiudadDTO) {
        try {
            await this.prismaService.ciudades.create({
                data: {
                    ciudad: ciudad.ciudad,
                    id_municipio: ciudad.id_municipio
                }
            })
            baseResponse.message = 'Ciudad creada exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al crear la ciudad.' + error
            return badResponse;
        }
    }

    async updateCiudad(id_ciudad: number, ciudad: CiudadDTO) {
        try {
            await this.prismaService.ciudades.update({
                data: {
                    ciudad: ciudad.ciudad,
                    id_municipio: ciudad.id_municipio
                },
                where: { id_ciudad }
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
            await this.prismaService.ciudades.delete({
                where: { id_ciudad }
            })
            baseResponse.message = 'Ciudad eliminada exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al eliminar la ciudad.' + error
            return badResponse;
        }
    }

}
