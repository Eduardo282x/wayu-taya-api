import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PeopleDTO, PersonProgramDTO } from './people.dto';

@Injectable()
export class PeopleService {
  constructor(private prismaService: PrismaService) {}

  async getPeople() {
    return await this.prismaService.people.findMany({
      include: { parish: true },
      where: { deleted: false },
      orderBy: { id: 'asc' },
    });
  }

  async getPeopleByProgram(programId: number) {
    const findProgram = await this.prismaService.programs.findFirst({
      where: { id: programId },
    });

    if (!findProgram) {
      throw new NotFoundException('No se encontró el programa');
    }

    return await this.prismaService.peoplePrograms
      .findMany({
        where: { id: programId },
        include: { people: true, program: true },
      })
      .then((data) => {
        return {
          program: data[0].program,
          people: data.map((item) => item.people),
        };
      });
  }

  async createPeople(people: PersonProgramDTO) {
    try {
      const personCreate = await this.prismaService.people.create({
        data: {
          name: people.name,
          lastName: people.lastName,
          address: people.address,
          email: people.email,
          phone: people.phone,
          identification: people.identification,
          sex: people.sex,
          birthdate: people.birthdate,
          parishId: people.id_parroquia,
        },
      });

      const dataPersonPrograms = people.id_programa.map((pro) => {
        return {
          peopleId: personCreate.id,
          programId: pro,
        };
      });

      await this.prismaService.peoplePrograms.createMany({
        data: dataPersonPrograms,
      });

      return { message: 'Persona creada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async createPersonWithoutProgram(people: PeopleDTO) {
    try {
      await this.prismaService.people.create({
        data: {
          name: people.name,
          lastName: people.lastName,
          address: people.address,
          email: people.email,
          phone: people.phone,
          identification: people.identification,
          sex: people.sex,
          birthdate: people.birthdate,
          parishId: people.id_parroquia,
        },
      });

      return { message: 'Persona guardada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updatePeople(personId: number, people: PersonProgramDTO) {
    try {
      await this.prismaService.people.update({
        data: {
          parishId: people.id_parroquia,
          name: people.name,
          lastName: people.lastName,
          address: people.address,
          email: people.email,
          phone: people.phone,
          identification: people.identification,
          sex: people.sex,
          birthdate: people.birthdate,
        },
        where: { id: personId },
      });
      if (people.cambioPersona) {
        await this.prismaService.peoplePrograms.deleteMany({
          where: { peopleId: personId },
        });
      }

      const dataPersonPrograms = people.id_programa.map((pro) => {
        return {
          peopleId: personId,
          programId: pro,
        };
      });

      await this.prismaService.peoplePrograms.createMany({
        data: dataPersonPrograms,
      });

      return { message: 'Datos de la Persona actualizados exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updatePersonWithoutProgram(
    personId: number,
    people: PeopleDTO,
  ) {
    try {
      await this.prismaService.people.update({
        data: {
          parishId: people.id_parroquia,
          name: people.name,
          lastName: people.lastName,
          address: people.address,
          email: people.email,
          phone: people.phone,
          identification: people.identification,
          sex: people.sex,
          birthdate: people.birthdate,
        },
        where: { id: personId },
      });

      return { message: 'Persona actualizada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async deletePeople(personId: number) {
    try {
      await this.prismaService.people.update({
        where: { id: personId },
        data: { deleted: true },
      });

      return { message: 'Persona eliminada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }
}
