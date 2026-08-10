import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProgramsDTO } from './programs.dto';

@Injectable()
export class ProgramsService {
  constructor(private prismaService: PrismaService) {}

  async getPrograms() {
    const programs = await this.prismaService.programs.findMany({
      orderBy: { id: 'asc' },
      where: { deleted: false },
    });

    return { programs };
  }

  async createPrograms(program: ProgramsDTO) {
    try {
      const programCreated = await this.prismaService.programs.create({
        data: {
          program: program.program,
          type: program.type,
        },
      });
      return { program: programCreated, message: 'Programa creado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updatePrograms(programId: number, programs: ProgramsDTO) {
    try {
      const programUpdated = await this.prismaService.programs.update({
        data: {
          program: programs.program,
          type: programs.type,
        },
        where: { id: programId },
      });
      return { program: programUpdated, message: 'Programa actualizado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async deletePrograms(id: number) {
    try {
      const programDeleted = await this.prismaService.programs.update({
        where: { id: id },
        data: { deleted: true },
      });

      return { program: programDeleted, message: 'Programa eliminado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }
}
