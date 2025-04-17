import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CiudadDTO } from './ciudades.dto';

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
                id_municipio: ciudad.idMunicipio
            }
        })
        return {message: 'Ciudad creada exitosamente.'}

        } catch (error) { return {message: 'Error al actualizar la ciudad.' + error}}
    }

    async updateCiudad(id_ciudad: number, ciudad: CiudadDTO) {
        try { 
                await this.prismaService.ciudades.update({
                    data: {
                        ciudad: ciudad.ciudad,
                        id_municipio: ciudad.idMunicipio
                    },
                    where: {
                        id_ciudad: id_ciudad
                    }
                })
                return {message: 'Ciudad actualizada exitosamente.'}
            } catch (error) { return {message: 'Error al actualizar la ciudad.' + error}}
        
    }

    async deleteCiudad(id_ciudad: number) {
        try {
                await this.prismaService.ciudades.delete({
                where: {
                    id_ciudad: id_ciudad
                }
                })
                return {message: 'Ciudad eliminada exitosamente.'}
            } catch (error) { return {message: 'Error al eliminar la ciudad.' + error}}
    }

}
