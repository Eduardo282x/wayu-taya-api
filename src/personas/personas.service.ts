import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PersonaProgramDTO, PersonasDTO } from './personas.dto';

@Injectable()
export class PersonasService {
  constructor(private prismaService: PrismaService) {}

  async getPersonas() {
    return await this.prismaService.people.findMany({
      include: { parish: true },
      where: { deleted: false },
      orderBy: { id: 'asc' },
    });
  }

  async getPersonasByProgram(id_programa: number) {
    const findProgram = await this.prismaService.programs.findFirst({
      where: { id: id_programa },
    });

    if (!findProgram) {
      throw new NotFoundException('No se encontró el programa');
    }

    return await this.prismaService.peoplePrograms
      .findMany({
        where: { id: id_programa },
        include: { people: true, program: true },
      })
      .then((data) => {
        return {
          programa: data[0].program,
          personas: data.map((item) => item.people),
        };
      });
  }

  async createPersonas(personas: PersonaProgramDTO) {
    try {
      const personaCreate = await this.prismaService.people.create({
        data: {
          name: personas.name,
          lastName: personas.lastName,
          address: personas.address,
          email: personas.email,
          phone: personas.phone,
          identification: personas.identification,
          sex: personas.sex,
          birthdate: personas.birthdate,
          parishId: personas.id_parroquia,
        },
      });

      const dataPersonasProgramas = personas.id_programa.map((pro) => {
        return {
          peopleId: personaCreate.id,
          programId: pro,
        };
      });

      await this.prismaService.peoplePrograms.createMany({
        data: dataPersonasProgramas,
      });

      return { message: 'Persona creada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async createPersonaWithoutProgram(personas: PersonasDTO) {
    try {
      await this.prismaService.people.create({
        data: {
          name: personas.name,
          lastName: personas.lastName,
          address: personas.address,
          email: personas.email,
          phone: personas.phone,
          identification: personas.identification,
          sex: personas.sex,
          birthdate: personas.birthdate,
          parishId: personas.id_parroquia,
        },
      });

      return { message: 'Persona guardada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updatePersonas(id_personas: number, personas: PersonaProgramDTO) {
    try {
      await this.prismaService.people.update({
        data: {
          parishId: personas.id_parroquia,
          name: personas.name,
          lastName: personas.lastName,
          address: personas.address,
          email: personas.email,
          phone: personas.phone,
          identification: personas.identification,
          sex: personas.sex,
          birthdate: personas.birthdate,
        },
        where: { id: id_personas },
      });
      if (personas.cambioPersona) {
        await this.prismaService.peoplePrograms.deleteMany({
          where: { peopleId: id_personas },
        });
      }

      const dataPersonasProgramas = personas.id_programa.map((pro) => {
        return {
          peopleId: id_personas,
          programId: pro,
        };
      });

      await this.prismaService.peoplePrograms.createMany({
        data: dataPersonasProgramas,
      });

      return { message: 'Datos de la Persona actualizados exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updatePersonasWithoutProgram(
    id_personas: number,
    personas: PersonasDTO,
  ) {
    try {
      await this.prismaService.people.update({
        data: {
          parishId: personas.id_parroquia,
          name: personas.name,
          lastName: personas.lastName,
          address: personas.address,
          email: personas.email,
          phone: personas.phone,
          identification: personas.identification,
          sex: personas.sex,
          birthdate: personas.birthdate,
        },
        where: { id: id_personas },
      });

      return { message: 'Persona actualizada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async deletePersonas(id_persona: number) {
    try {
      await this.prismaService.people.update({
        where: { id: id_persona },
        data: { deleted: true },
      });

      return { message: 'Persona eliminada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }
}
