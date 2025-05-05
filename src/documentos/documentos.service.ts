import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DocumentoDTO } from './documentos.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';


@Injectable()
export class DocumentosService {

    constructor(private prismaService: PrismaService) {
    }

    async getDocumentos() {
        return await this.prismaService.documentos.findMany({
            orderBy: { id_documento: 'asc' },
            include: {
                Parroquias: true,
                Colaboradores: {
                    include: {
                        personas: true
                    }
                }
            }
        });
    }

    async getDocumentosFixed() {
        return this.getDocumentos().then(res => res.map(data => {
            return {
                ...data,
                Colaboradores: data.Colaboradores.map(co => co.personas)
            }
        }))
    }

    async createDocumento(documento: DocumentoDTO) {
        try {
            const documentoCreated = await this.prismaService.documentos.create({
                data: {
                    nombre_documento: documento.nombre_documento,
                    fecha: documento.fecha,
                    parroquiasId_parroquia: documento.parroquiasId_parroquia,
                },
            });

            const dataColaboradores = documento.id_personas.map((idp) => {
                return {
                    id_documento: documentoCreated.id_documento,
                    id_persona: idp
                }
            });

            await this.prismaService.colaboradores.createMany({
                data: dataColaboradores
            })

            baseResponse.message = 'Documento creado exitosamente.';
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al crear el documento: ' + error
            return badResponse;
        }
    }

    async updateDocumento(id_documento: number, documento: DocumentoDTO) {
        try {
            await this.prismaService.documentos.update({
                data: {
                    nombre_documento: documento.nombre_documento,
                    fecha: documento.fecha,
                    parroquiasId_parroquia: documento.parroquiasId_parroquia
                },
                where: { id_documento }
            })
            //eliminar colaboradores para agregar nuevos colaboradores
            await this.prismaService.colaboradores.deleteMany({
                where: { id_documento },
            });

            const dataColaboradores = documento.id_personas.map((idp) => {
                return {
                    id_documento: id_documento,
                    id_persona: idp
                }
            })

            await this.prismaService.colaboradores.createMany({
                data: dataColaboradores
            })

            baseResponse.message = 'Documento actualizado exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al actualizar el documento.' + error
            return badResponse;
        }
    }

    async deleteDocumento(id_documento: number) {
        try {
            await this.prismaService.colaboradores.deleteMany({
                where: { id_documento }
            })

            await this.prismaService.documentos.delete({
                where: { id_documento }
            })
            baseResponse.message = 'Documento eliminado exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al eliminar el documento.' + error
            return badResponse;
        }
    }
}
