import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MunicipioDTO } from './municipios.dto';

@Injectable()
export class MunicipiosService {
  constructor(private prismaService: PrismaService) {}

  async getMunicipios() {
    return await this.prismaService.city.findMany({
      include: { state: true },
    });
  }

  async createMunicipio(municipio: MunicipioDTO) {
    try {
      await this.prismaService.city.create({
        data: {
          name: municipio.municipio,
          stateId: municipio.id_estado,
        },
      });
      return { message: 'Municipio creado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updateMunicipio(id_municipio: number, municipio: MunicipioDTO) {
    try {
      await this.prismaService.city.update({
        data: { name: municipio.municipio },
        where: { id: id_municipio },
      });
      return { message: 'Municipio actualizado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async deleteMunicipio(id_municipio: number) {
    try {
      await this.prismaService.city.delete({
        where: { id: id_municipio },
      });
      return { message: 'Municipio deleted exitosamente.' };
    } catch (err) {
      throw err;
    }
  }
}
