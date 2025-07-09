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
            baseResponse.message = 'exito al crear el program.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al crear el program.' + error
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
            baseResponse.message = 'éxito al actualizar el program.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al actualizar el program.' + error
            return badResponse;
        }
    }

    async deletePrograms(id: number) {
        try {
            await this.prismaService.programs.update({
                where: { id: id },
                data: { deleted: true }
            });

            baseResponse.message = 'persona deleted exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al eliminar persona.' + error
            return badResponse;
        }
    }

}