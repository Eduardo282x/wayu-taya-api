import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EstadoDTO } from './estados.dto';

@Injectable()
export class EstadosService {

    constructor(private prismaService: PrismaService) {

    }

    async getEstados() {
        return await this.prismaService.estados.findMany();
    }

    async createEstado(estado: EstadoDTO) {
        await this.prismaService.estados.create({
            data: {
                estado: estado.estados
            }
        })
        return {message: 'Estado creado exitosamente.'}
    }

    async updateEstado(id_estado: number, estado: EstadoDTO) {
        await this.prismaService.estados.update({
            data: {
                estado: estado.estados
            },
            where: {
                id_estado: id_estado
            }
        })
        return {message: 'Estado actualizado exitosamente.'}
    }

    async deleteEstado(id_estado: number) {
        await this.prismaService.estados.delete({
            where: {
                id_estado: id_estado
            }
        })
        return {message: 'Estado eliminado exitosamente.'}
    }
}
