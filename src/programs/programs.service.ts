import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProgramsDTO } from './programs.dto';

@Injectable()
export class ProgramsService {
  constructor(private prismaService: PrismaService) {}

  async getPrograms() {
    return await this.prismaService.programs.findMany({
      orderBy: { id: 'asc' },
      where: { deleted: false },
    });
  }

  async createPrograms(program: ProgramsDTO) {
    try {
      await this.prismaService.programs.create({
        data: {
          program: program.program,
          type: program.type,
        },
      });
      return { message: 'Programa creado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updatePrograms(programId: number, programs: ProgramsDTO) {
    try {
      await this.prismaService.programs.update({
        data: {
          program: programs.program,
          type: programs.type,
        },
        where: { id: programId },
      });
      return { message: 'Programa actualizado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async deletePrograms(id: number) {
    try {
      await this.prismaService.programs.update({
        where: { id: id },
        data: { deleted: true },
      });

      return { message: 'Programa eliminado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }
}
