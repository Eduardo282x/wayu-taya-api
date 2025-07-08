import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MunicipioDTO } from './municipios.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class MunicipiosService {

    constructor(private prismaService: PrismaService) {

    }

    async getMunicipios() {
        return await this.prismaService.city.findMany({
            include: { state: true }
        });
    }

    async createMunicipio(municipio: MunicipioDTO) {
        try {
            await this.prismaService.city.create({
                data: {
                    name: municipio.municipio,
                    stateId: municipio.id_estado
                }
            })
            baseResponse.message = 'Municipio creado exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al crear Municipio.' + error
            return badResponse;
        }
    }

    async updateMunicipio(id_municipio: number, municipio: MunicipioDTO) {
        try {
            await this.prismaService.city.update({
                data: { name: municipio.municipio },
                where: { id: id_municipio }
            })
            baseResponse.message = 'Municipio actualizado exitosamente.'
            return baseResponse;
        }
        catch (error) {
            badResponse.message = 'Error al actualizar municipio.' + error
            return badResponse;
        }
    }

    async deleteMunicipio(id_municipio: number) {
        try {
            await this.prismaService.city.delete({
                where: { id: id_municipio }
            })
            baseResponse.message = 'Municipio deleted exitosamente.'
            return baseResponse;
        } catch (err) {
            badResponse.message = 'Error al eliminar municipio.' + err
            return badResponse;
        }
    }

}
