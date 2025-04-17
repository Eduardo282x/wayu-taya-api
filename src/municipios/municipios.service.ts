import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MunicDTO } from './municipios.dto';

@Injectable()
export class MunicipiosService {

    constructor(private prismaService: PrismaService) {

    }

    async getMunicipios() {
        return await this.prismaService.municipios.findMany();
    }

    async createMunicipio(municipio: MunicDTO) {
        await this.prismaService.municipios.create({
            data: {
                municipio: municipio.municipios,
                id_estado: municipio.id_estado
                
            }
        })
        return {message: 'Municipio creado exitosamente.'}
    }

    async updateMunicipio(id_municipio: number, municipio: MunicDTO) {
        await this.prismaService.municipios.update({
            data: {
                municipio: municipio.municipios
            },
            where: {
                id_municipio: id_municipio
            }
        })
        return {message: 'Municipio actualizado exitosamente.'}
    }

    async deleteMunicipio(id_municipio: number) {
        await this.prismaService.municipios.delete({
            where: {
                id_municipio: id_municipio
            }
        })
        return {message: 'Municipio eliminado exitosamente.'}
    }

}
