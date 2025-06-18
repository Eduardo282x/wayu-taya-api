import { Body, Controller, Delete, Get, Param, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentDTO } from './documents.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('documents')
export class DocumentsController {

    constructor(private documentService: DocumentsService) {}

    @Get()
    async getDocuments() {
        return await this.documentService.getDocuments()
    }

    @Get('/fixed')
    async getDocumentsFixed() {
        return await this.documentService.getDocumentsFixed()
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
    uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: { name: string; date: string }) {
        return this.documentService.createFile(file, body);
    }

}
