import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PersonaProgramDTO, PersonasDTO } from './personas.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class PersonasService {

    constructor(private prismaService: PrismaService) {

    }

    async getPersonas() {
        return await this.prismaService.people.findMany({
            include: { parish: true },
            where: { deleted: false },
            orderBy: { id: 'asc' }
        });
    }

    async getPersonasByProgram(id_programa: number) {
        const findProgram = await this.prismaService.programs.findFirst({
            where: { id: id_programa }
        });

        if (!findProgram) {
            badResponse.message = 'No se encontró el programa'
            return badResponse;
        }


        return await this.prismaService.peoplePrograms.findMany({
            where: { id: id_programa },
            include: { people: true, program: true }
        }).then(data => {
            return {
                programa: data[0].program,
                personas: data.map(item => item.people)
            }
        })
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
                    parishId: personas.id_parroquia
                }
            })

            const dataPersonasProgramas = personas.id_programa.map((pro) => {
                return {
                    peopleId: personaCreate.id,
                    programId: pro
                }
            })

            await this.prismaService.peoplePrograms.createMany({
                data: dataPersonasProgramas

            })

            baseResponse.message = 'exito al crear a la persona.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al crear a la persona.' + error
            return badResponse;
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
                    parishId: personas.id_parroquia
                }
            })

            baseResponse.message = 'Persona guardada exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al crear a la persona.' + error
            return badResponse;
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
                    birthdate: personas.birthdate
                },
                where: { id: id_personas }
            });
            if (personas.cambioPersona) {
                await this.prismaService.peoplePrograms.deleteMany({
                    where: { peopleId: id_personas }
                })
            }

            const dataPersonasProgramas = personas.id_programa.map((pro) => {
                return {
                    peopleId: id_personas,
                    programId: pro
                }
            })

            await this.prismaService.peoplePrograms.createMany({
                data: dataPersonasProgramas
            })

            baseResponse.message = 'Persona actualizada exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al actualizar la persona.' + error
            return badResponse;
        }
    }

    async updatePersonasWithoutProgram(id_personas: number, personas: PersonasDTO) {
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
                    birthdate: personas.birthdate
                },
                where: { id: id_personas }
            });

            baseResponse.message = 'persona actualizada exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al actualizar la persona.' + error
            return badResponse;
        }
    }

    async deletePersonas(id_persona: number) {
        try {
            await this.prismaService.people.update({
                where: { id: id_persona },
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
