import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProgramsDTO } from './programs.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class ProgramsService {

    constructor(private prismaService: PrismaService) {

    }

    async getPrograms() {
        return await this.prismaService.programs.findMany({
            orderBy: { id: 'asc' },
            where: { deleted: false }
        })
    }

    async createPrograms(program: ProgramsDTO) {
        try {
            await this.prismaService.programs.create({
                data: {
                    program: program.program,
                    type: program.type
                }
            })
            baseResponse.message = 'Programa creado exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al crear el Programa.' + error
            return badResponse;
        }
    }

    async updatePrograms(id_programs: number, programs: ProgramsDTO) {
        try {
            await this.prismaService.programs.update({
                data: {
                    program: programs.program,
                    type: programs.type,
                },
                where: { id: id_programs }
            });
            baseResponse.message = 'Programa actualizado exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al actualizar el Programa.' + error
            return badResponse;
        }
    }

    async deletePrograms(id: number) {
        try {
            await this.prismaService.programs.update({
                where: { id: id },
                data: { deleted: true }
            });

            baseResponse.message = 'Programa eliminado exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al eliminar el programa.' + error
            return badResponse;
        }
    }

}