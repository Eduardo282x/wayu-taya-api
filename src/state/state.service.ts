import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StateDTO } from './state.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class StateService {

    constructor(private prismaService: PrismaService) {

    }

    async getState() {
        return await this.prismaService.state.findMany();
    }

    async createState(state: StateDTO) {
        try {
            await this.prismaService.state.create({
                data: {
                    name: state.name
                }
            })
            baseResponse.message = 'Estado creado exitosamente.'
            return baseResponse;
        } catch (err) {
            badResponse.message = 'Error al crear el state.' + err
            return badResponse;
        }
    }

    async updateState(id: number, state: StateDTO) {
        try {
            await this.prismaService.state.update({
                data: { name: state.name },
                where: { id }
            })
            baseResponse.message = 'Estado actualizado exitosamente.'
            return baseResponse
        } catch (err) {
            badResponse.message = 'Error al actualizar el state.' + err
            return badResponse;
        }
    }

    async deleteState(id: number) {
        try {
            await this.prismaService.state.delete({
                where: { id }
            })
            baseResponse.message = 'Estado eliminado exitosamente.'
            return baseResponse;
        } catch (err) {
            badResponse.message = 'Error al eliminar el state.' + err
            return badResponse;
        }
    }
}
