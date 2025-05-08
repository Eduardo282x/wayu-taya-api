import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PersonasDTO } from './personas.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class PersonasService {

    constructor(private prismaService: PrismaService) {

    }

    async getPersonas() {
        return await this.prismaService.personas.findMany({
            include: { parroquia: true },
            where: { eliminado: false },
            orderBy: { id_persona: 'asc' }
        });
    }

    async getPersonasByProgram(id_programa: number) {
        const findProgram = await this.prismaService.programas.findFirst({
            where: { id_programa }
        });

        if(!findProgram){
            badResponse.message = 'No se encontró el programa'
            return badResponse;
        }


        return await this.prismaService.personasProgramas.findMany({
            where: { id_programa },
            include: { persona: true, programa: true }
        }).then(data => {
            return {
                programa: data[0].programa,
                personas: data.map(item => item.persona)
            }
        })
    }

    async createPersonas(personas: PersonasDTO) {
        try {
            const personaCreate = await this.prismaService.personas.create({
                data: {
                    nombre: personas.nombre,
                    apellido: personas.apellido,
                    direccion: personas.direccion,
                    email: personas.email,
                    telefono: personas.telefono,
                    cedula: personas.cedula,
                    sexo: personas.sexo,
                    fecha_nacimiento: personas.fecha_nacimiento,
                    activo: true,
                    id_parroquia: personas.id_parroquia
                }
            })

            const dataPersonasProgramas = personas.id_programa.map((pro) => {
                return {
                    id_persona: personaCreate.id_persona,
                    id_programa: pro
                }
            })

            await this.prismaService.personasProgramas.createMany({
                data: dataPersonasProgramas

            })

            baseResponse.message = 'exito al crear a la persona.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al crear a la persona.' + error
            return badResponse;
        }
    }

    async updatePersonas(id_personas: number, personas: PersonasDTO) {
        try {
            await this.prismaService.personas.update({
                data: {
                    id_parroquia: personas.id_parroquia,
                    nombre: personas.nombre,
                    apellido: personas.apellido,
                    direccion: personas.direccion,
                    email: personas.email,
                    telefono: personas.telefono,
                    cedula: personas.cedula,
                    sexo: personas.sexo,
                    fecha_nacimiento: personas.fecha_nacimiento
                },
                where: { id_persona: id_personas }
            });
            if (personas.cambioPersona) {
                await this.prismaService.personasProgramas.deleteMany({
                    where: { id_persona: id_personas }
                })
            }

            const dataPersonasProgramas = personas.id_programa.map((pro) => {
                return {
                    id_persona: id_personas,
                    id_programa: pro
                }
            })

            await this.prismaService.personasProgramas.createMany({
                data: dataPersonasProgramas
            })

            baseResponse.message = 'persona actualizada exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al actualizar la persona.' + error
            return badResponse;
        }
    }

    async deletePersonas(id_persona: number) {
        try {
            await this.prismaService.personas.update({
                where: { id_persona: id_persona },
                data: { eliminado: true }
            });


            baseResponse.message = 'persona eliminado exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al eliminar persona.' + error
            return badResponse;
        }
    }


}
