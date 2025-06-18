import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DocumentDTO } from './documents.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';


@Injectable()
export class DocumentsService {

    constructor(private prismaService: PrismaService) {
    }

    async getDocuments() {
        return await this.prismaService.documents.findMany({
            orderBy: { id: 'asc' },
            include: {
                collaborators: {
                    include: {
                        people: true
                    }
                }
            }

        });
    }

    async getDocumentsFixed() {
        return this.getDocuments().then(res => res.map(data => {
            return {
                ...data,
                Colaboradores: data.collaborators.map(co => co.people)
            }
        }))
    }

    async createDocument(document: DocumentDTO) {
        try {
            const documentCreated = await this.prismaService.documents.create({
                data: {
                    name: document.name,
                    date: document.date,
                },
            });

            const dataCollaborators = document.peopleId.map((idp) => {
                return {
                    documentId: documentCreated.id,
                    peopleId: idp
                }
            });

            await this.prismaService.collaborators.createMany({
                data: dataCollaborators
            })

            baseResponse.message = 'Documento creado exitosamente.';
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al crear el documento: ' + error
            return badResponse;
        }
    }

    async updateDocument(id: number, document: DocumentDTO) {
        try {
            await this.prismaService.documents.update({
                data: {
                    name: document.name,
                    date: document.date,
                },
                where: { id }
            })

            await this.prismaService.collaborators.deleteMany({
                where: { id },
            });

            const dataCollaborators = document.peopleId.map((idp) => {
                return {
                    documentId: id,
                    peopleId: idp
                }
            })

            await this.prismaService.collaborators.createMany({
                data: dataCollaborators
            })

            baseResponse.message = 'Documento actualizado exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al actualizar el documento.' + error
            return badResponse;
        }
    }

    async deleteDocument(id: number) {
        try {
            await this.prismaService.documents.update({
                where: { id },
                data: { deleted: true }
            });

            baseResponse.message = 'Documento deleted exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al eliminar el documento.' + error
            return badResponse;
        }
    }

    async createFile(file: Express.Multer.File, data: { name: string; date: string }) {
        try {
            await this.prismaService.documents.create({
                data: {
                    name: data.name,
                    date: new Date(data.date),
                    fileName: file.filename,
                    filePath: file.path,
                    mimeType: file.mimetype,
                },
            });

            baseResponse.message = 'Documento guardado exitosamente.';
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al crear documento: ' + error;
            return badResponse;
        }
    }

}
