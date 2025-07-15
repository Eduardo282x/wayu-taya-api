import { Body, Controller, Delete, Get, Param, Post, Put, UploadedFile, UseInterceptors, Res, HttpStatus, HttpException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentDTO, NewDocumentDTO } from './documents.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

@Controller('documents')
export class DocumentsController {

    constructor(private documentService: DocumentsService) { }

    @Get()
    async getDocuments() {
        return await this.documentService.getDocuments()
    }

    @Get('/fixed')
    async getDocumentsFixed() {
        return await this.documentService.getDocumentsFixed()
    }

    @Get('/download/:id')
    async downloadDocument(@Param('id') id: string, @Res() res: Response) {
        const document = await this.documentService.findDocument(Number(id));

        if (!document) {
            return res.status(404).json({ message: 'Documento no encontrado' });
        }

        const filePath = join(process.cwd(), document.filePath);

        if (!existsSync(filePath)) {
            return res.status(404).json({ message: 'Archivo no encontrado en el servidor' });
        }

        return res.download(filePath, document.name);
    }

    @Post()
    async createDocument(@Body() data: DocumentDTO) {
        return await this.documentService.createDocument(data);
    }

    @Put('/:id')
    async updateDocument(@Param('id') id_document: string, @Body() data: DocumentDTO) {
        return await this.documentService.updateDocument(Number(id_document), data);
    }

    @Delete('/:id')
    async deleteDocument(@Param('id') id_document: string) {
        return await this.documentService.deleteDocument(Number(id_document));
    }

    @Post('/upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/documents',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            },
        }),
    }))
    uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: NewDocumentDTO) {
        return this.documentService.createFile(file, body);
    }

    @Get('/pdf/adulto')
    async generateAdultPDF(@Res() res: Response) {
        try {
            const pdfBuffer = await this.documentService.generateAdultPDF();

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=autorizacion_usodeimagen.pdf',
                'Content-Length': pdfBuffer.length,
            });

            res.end(pdfBuffer);
        } catch (error) {
            console.error('Error generando PDF:', error);
            throw new HttpException('Error generando PDF', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('/pdf/representante-legal')
    async generateMinorPDF(@Res() res: Response) {
        try {
            const pdfBuffer = await this.documentService.generateMinorPDF();

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=autorizacion_usodeimagen_representantelegal.pdf',
                'Content-Length': pdfBuffer.length,
            });

            res.end(pdfBuffer);
        } catch (error) {
            console.error('Error generando PDF:', error);
            throw new HttpException('Error generando PDF', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
