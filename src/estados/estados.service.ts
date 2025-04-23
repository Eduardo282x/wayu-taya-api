import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EstadoDTO } from './estados.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class EstadosService {

    constructor(private prismaService: PrismaService) {

    }

    async getEstados() {
        return await this.prismaService.estados.findMany();
    }

    async createEstado(estado: EstadoDTO) {
        try {
            await this.prismaService.estados.create({
                data: {
                    estado: estado.estado
                }
            })
            baseResponse.message = 'Estado creado exitosamente.'
            return baseResponse;
        } catch (err) {
            badResponse.message = 'Error al crear el estado.' + err
            return badResponse;
        }
    }

    async updateEstado(id_estado: number, estado: EstadoDTO) {
        try {
            await this.prismaService.estados.update({
                data: { estado: estado.estado },
                where: { id_estado }
            })
            baseResponse.message = 'Estado actualizado exitosamente.'
            return baseResponse
        } catch (err) {
            badResponse.message = 'Error al actualizar el estado.' + err
            return badResponse;
        }
    }

    async deleteEstado(id_estado: number) {
        try {
            await this.prismaService.estados.delete({
                where: { id_estado }
            })
            baseResponse.message = 'Estado eliminado exitosamente.'
            return baseResponse;
        } catch (err) {
            badResponse.message = 'Error al eliminar el estado.' + err
            return badResponse;
        }
    }
}
