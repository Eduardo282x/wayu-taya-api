import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ParroquiasDTO } from './parroquias.dto';

@Injectable()
export class ParroquiasService {
  constructor(private prismaService: PrismaService) {}

  async getParroquia() {
    return await this.prismaService.parish.findMany({
      include: { town: { include: { city: { include: { state: true } } } } },
    });
  }

  async createParroquia(parroquia: ParroquiasDTO) {
    try {
      await this.prismaService.parish.create({
        data: {
          name: parroquia.parroquia,
          townId: parroquia.id_ciudad,
        },
      });
      return { message: 'Parroquia creada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updateParroquia(id_parroquia: number, parroquia: ParroquiasDTO) {
    try {
      await this.prismaService.parish.update({
        data: { name: parroquia.parroquia },
        where: { id: id_parroquia },
      });
      return { message: 'Parroquia actualizada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async deleteParroquia(id_parroquia: number) {
    try {
      await this.prismaService.parish.delete({
        where: { id: id_parroquia },
      });
      return { message: 'Parroquia eliminada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }
}
