import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DocumentDTO, NewDocumentDTO } from './documents.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';
const PDFDocument = require('pdfkit-table');

@Injectable()
export class DocumentsService {

    constructor(private prismaService: PrismaService) {
    }

    async getDocuments() {
        return await this.prismaService.documents.findMany({
            orderBy: { id: 'asc' },
            where: { deleted: false },
            include: {
                collaborators: {
                    include: {
                        people: true
                    }
                }
            }

        });
    }

    async findDocument(id: number) {
        return await this.prismaService.documents.findFirst({
            where: { id }
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

            baseResponse.message = 'Documento eliminado exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al eliminar el documento.' + error
            return badResponse;
        }
    }

    async createFile(file: Express.Multer.File, data: NewDocumentDTO) {
        try {
            await this.prismaService.documents.create({
                data: {
                    name: data.name,
                    type: data.type,
                    description: data.description,
                    content: data.content,
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

    async generateAdultPDF(): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });

            const buffers: Uint8Array[] = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', (err) => reject(err));

            try {
                const logoWidth = 140;
                const pageWidth = doc.page.width;
                const x = (pageWidth - logoWidth) / 2;
                doc.image('src/assets/logo.png', x, 30, { width: logoWidth });
            } catch (err) {
                console.warn('No se pudo cargar el logotipo:', err);
            }
            doc.moveDown(3.5);

            doc.font('Helvetica-Bold').fontSize(12).text('AUTORIZACIÓN DE USO DE IMAGEN MAYORES DE EDAD', {
                align: 'center',
                underline: true,
            });

            doc.moveDown(0.8);
            doc.font('Helvetica').fontSize(10.8);

            const texto = `
    Yo, _________________________, venezolano(a), mayor de edad, titular de la Cédula de Identidad No. __________________, domiciliado(a) en ___________________________________, en mi condición de _____________________________, por el presente documento declaro: De conformidad con lo establecido en el Artículo 60 de la Constitución de la República Bolivariana de Venezuela, Autorizo a la FUNDACIÓN WAYUU TAYA Asociación Civil Sin Fines de Lucro domiciliada en Maracaibo, debidamente inscrita por ante la Oficina Subalterna del Primer Circuito de Registro del Municipio Autónomo Maracaibo del Estado Zulia, en fecha 18 de Julio de 2002, anotada bajo el No. 9; Tomo: 6; Protocolo 1º; cuyo objeto es fomentar el desarrollo integral y bienestar del pueblo indígena, en las áreas económicas, social, cultural, educativo y de salud; a utilizar de manera gratuita las imágenes fotográficas, entrevistas y grabaciones en video, así como mi nombre y testimonio en materiales institucionales e informativos, impresos o digitales relacionados con los programas que realiza la Fundación, sin limitación alguna, quedando Autorizada a divulgar, reproducir, editar, publicar y en general utilizar la imagen, nombre, información personal y testimonio de manera gratuita, en cualquier material impreso e informativo y cualquier otro soporte material vinculado con el objeto de la Fundación. Dicha Autorización se extiende a todos los programas sociales, culturales y educativos implementados o que implemente la Fundación, que estén dirigidos al público por cualquier medio de comunicación, ya sea redes sociales, páginas web, materiales impresos, plataformas tecnológicas y digitales, trípticos informativos, así como su utilización gratuita en programas de televisión, anuncios publicitarios, conferencias, foros y talleres, referidos a temas sociales, educativos y culturales, que promuevan y garanticen el respeto, desarrollo y conservación de los pueblos indígenas. 
    El ámbito de aplicación de esta Autorización es la República Bolivariana de Venezuela y en el resto del mundo, por todo el lapso de protección que otorga por vía de analogía la Ley sobre el derecho de autor y de derechos conexos de la República Bolivariana de Venezuela; siendo la presente Autorización de tipo gratuito, por lo que las publicaciones que se hagan sobre mi imagen, nombre, información personal y testimonio no generarán ninguna contraprestación. En virtud de lo expuesto declaro que nada tengo que reclamar a la FUNDACIÓN WAYUU TAYA por concepto de remuneración, indemnización o cualquier otro tipo de ingreso o contraprestación por lo anteriormente señalado.
    Por último declaro que la utilización de mi imagen en los términos previstos en este documento, no contraviene mi honor, reputación, imagen, vida privada e intimidad familiar, de conformidad con lo señalado en los Artículos 60 de la Constitución de la República Bolivariana de Venezuela, por lo que renuncio expresamente a cualquier acción de naturaleza Civil, Penal e Indemnizatoria que pudiera derivarse de lo que establezca la legislación en materia de derechos de Honor, Reputación, Imagen, Vida Privada e Intimidad Familiar.
    `;

            doc.text(texto.trim(), {
                align: 'justify',
                lineGap: 4,
            });

            doc.moveDown(1);


            doc.text('En ___________________, a los ____ días del mes de ________________ de 202__.', {
                align: 'left',
            });

            doc.moveDown(2);
            doc.text('Nombre y Apellido: _________________________________     Firma: _______________________', {
                align: 'left',
            });
            doc.moveDown(1);
            doc.text('C.I.: ____________________________________', {
                align: 'left',
            });

            doc.end();
        });
    }

    async generateMinorPDF(): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });

            const buffers: Uint8Array[] = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', (err) => reject(err));

            try {
                const logoWidth = 140;
                const pageWidth = doc.page.width;
                const x = (pageWidth - logoWidth) / 2;
                doc.image('src/assets/logo.png', x, 30, { width: logoWidth });
            } catch (err) {
                console.warn('No se pudo cargar el logotipo:', err);
            }
            doc.moveDown(3.5);

            doc.font('Helvetica-Bold').fontSize(12).text('AUTORIZACIÓN DE USO DE IMAGEN REPRESENTANTE LEGAL', {
                align: 'center',
                underline: true,
            });

            doc.moveDown(0.8);
            doc.font('Helvetica').fontSize(10.5);

            const texto = `
    Yo, _________________________, venezolano(a), mayor de edad, titular de la Cédula de Identidad No. ________________, domiciliado en _____________________________, en mi condición de Representante Legal del Menor _________________________, venezolano(a), de ___________ años de edad, titular de la Cédula de Identidad No. ________________, de mí mismo domicilio, inscrito en la Unidad Educativa ____________________, por el presente documento declaro: De conformidad con lo establecido en el Identidad No. Artículo 60 de la Constitución de la República Bolivariana de Venezuela, en concordancia con el Articulo 65 de la Ley Orgánica para la Protección de Niños, Niñas y Adolescentes, AUTORIZO a la FUNDACIÓN WAYUU TAYA; Asociación Civil Sin Fines de Lucro domiciliada en Maracaibo, debidamente inscrita por ante la Oficina Subalterna del Primer Circuito de Registro del Municipio Autónomo Maracaibo del Estado Zulia, en fecha 18 de Julio de 2002, anotada bajo el No. 9; Tomo: 6; Protocolo 1°; cuyo objeto es fomentar el desarrollo integral y bienestar del pueblo indígena, en las áreas económicas, social, cultural, educativo y de salud; a utilizar de manera gratuita las imágenes fotográficas, entrevistas y grabaciones en video, así como el nombre y testimonio de mi representado en materiales institucionales e informativos, impresos o digitales relacionados con los programas que realiza la Fundación, sin limitación alguna; quedando Autorizada a divulgar, reproducir, editar, publicar y en general utilizar la imagen, nombre, información personal y testimonio de manera gratuita, en cualquier material impreso e informativo y cualquier otro soporte material vinculado con el objeto de la Fundación.
    Dicha Autorización se extiende a todos los programas sociales, culturales y educativos implementados o que implemente la Fundación, que estén dirigidos al público por cualquier medio de comunicación, ya sea redes sociales, páginas web, materiales impresos, plataformas tecnológicas y digitales, trípticos informativos, así como su utilización gratuita en programas de televisión, anuncios publicitarios, conferencias, foros y talleres, referidos a temas sociales, educativos y culturales, que promuevan y garanticen el respeto, desarrollo y conservación de los pueblos indígenas.
    El ámbito de aplicación de esta Autorización es la República Bolivariana de Venezuela y en el resto del mundo, por todo el lapso de protección que otorga por vía de analogía la Ley sobre el derecho de autor y de derechos conexos de la República Bolivariana de Venezuela; siendo la presente Autorización de tipo gratuito, por lo que las publicaciones que se hagan sobre la imagen de mi representado, su nombre, información personal y testimonio no generará ninguna contraprestación. En virtud de lo expuesto declaro que nada tengo que reclamar a la FUNDACIÓN WAYUU TAYA por concepto de remuneración, indemnización o cualquier otro tipo de ingreso o contraprestación por lo anteriormente señalado.
    Por ultimo declaro que la utilización de la imagen de mi representado en los términos previstos en este documento, no contraviene el honor, la reputación, la imagen, vida privada e intimidad familiar de mi representado, de conformidad con lo señalado en los Artículos 60 de la Constitución de la República Bolivariana de Venezuela, en concordancia con el Articulo 65 de la Ley Orgánica para la Protección de Niños, Niñas y Adolescentes, por lo que renuncio expresamente a cualquier acción de naturaleza Civil, Penal e Indemnizatoria que pudiera derivarse de lo que establezca la legislación en materia de derechos de Honor, Reputación, Imagen, Vida Privada e Intimidad Familiar.
    `;
            doc.text(texto.trim(), {
                align: 'justify',
                lineGap: 3,
            });

            doc.text('En ___________________, a los ____ días del mes de ________________ de 202__.', {
                align: 'left',
            });

            doc.moveDown(1);
            doc.text('Representante Legal');
            doc.moveDown(0.2);
            doc.text('Nombre y Apellido: ___________________________________     Firma: _________________________', {
                align: 'left',
            });
            doc.moveDown(0.5);
            doc.text('C.I.: ______________________________', {
                align: 'left',
            });

            doc.end();
        });
    }
}
