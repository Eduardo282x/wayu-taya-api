import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MunicipioDTO } from './municipios.dto';

@Injectable()
export class MunicipiosService {
  constructor(private prismaService: PrismaService) {}

  async getMunicipios() {
    const cities = await this.prismaService.city.findMany({
      include: { state: true },
    });

    return { cities };
  }

  async createMunicipio(municipio: MunicipioDTO) {
    try {
      const cityCreated = await this.prismaService.city.create({
        data: {
          name: municipio.municipio,
          stateId: municipio.id_estado,
        },
      });
      return { city: cityCreated, message: 'Municipio creado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updateMunicipio(id_municipio: number, municipio: MunicipioDTO) {
    try {
      const cityUpdated = await this.prismaService.city.update({
        data: { name: municipio.municipio },
        where: { id: id_municipio },
      });
      return { city: cityUpdated, message: 'Municipio actualizado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async deleteMunicipio(id_municipio: number) {
    try {
      const cityDeleted = await this.prismaService.city.delete({
        where: { id: id_municipio },
      });
      return { city: cityDeleted, message: 'Municipio deleted exitosamente.' };
    } catch (err) {
      throw err;
    }
  }
}
