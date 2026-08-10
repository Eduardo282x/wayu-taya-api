import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TownDTO } from './town.dto';

@Injectable()
export class TownService {
  constructor(private prismaService: PrismaService) {}

  async getTown() {
    return await this.prismaService.town.findMany({
      include: {
        city: true,
      },
    });
  }

  async createCiudad(ciudad: TownDTO) {
    try {
      await this.prismaService.town.create({
        data: {
          name: ciudad.town,
          cityId: ciudad.id_municipio,
        },
      });
      return { message: 'Ciudad creada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updateCiudad(id_ciudad: number, ciudad: TownDTO) {
    try {
      await this.prismaService.town.update({
        data: {
          name: ciudad.town,
          cityId: ciudad.id_municipio,
        },
        where: { id: id_ciudad },
      });
      return { message: 'Ciudad actualizada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async deleteCiudad(id_ciudad: number) {
    try {
      await this.prismaService.town.delete({
        where: { id: id_ciudad },
      });
      return { message: 'Ciudad eliminada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }
}
