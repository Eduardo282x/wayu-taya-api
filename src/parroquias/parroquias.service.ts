import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ParroquiasDTO } from './parroquias.dto';

@Injectable()
export class ParroquiasService {
  constructor(private prismaService: PrismaService) {}

  async getParroquia() {
    const parishes = await this.prismaService.parish.findMany({
      include: { town: { include: { city: { include: { state: true } } } } },
    });

    return { parishes };
  }

  async createParroquia(parroquia: ParroquiasDTO) {
    try {
      const parishCreated = await this.prismaService.parish.create({
        data: {
          name: parroquia.parroquia,
          townId: parroquia.id_ciudad,
        },
      });
      return { parish: parishCreated, message: 'Parroquia creada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updateParroquia(id_parroquia: number, parroquia: ParroquiasDTO) {
    try {
      const parishUpdated = await this.prismaService.parish.update({
        data: { name: parroquia.parroquia },
        where: { id: id_parroquia },
      });
      return { parish: parishUpdated, message: 'Parroquia actualizada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async deleteParroquia(id_parroquia: number) {
    try {
      const parishDeleted = await this.prismaService.parish.delete({
        where: { id: id_parroquia },
      });
      return { parish: parishDeleted, message: 'Parroquia eliminada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }
}
