import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentDTO } from './documents.dto';

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
    async createDocument(@Body() datos: DocumentDTO) {
        return await this.documentService.createDocument(datos);
    }

    @Put('/:id')
    async updateDocument(@Param('id') id_document: string, @Body() datos: DocumentDTO) {
        return await this.documentService.updateDocument(Number(id_document), datos);
    }
    
    @Delete('/:id')
    async deleteDocument(@Param('id') id_document: string) {
        return await this.documentService.deleteDocument(Number(id_document));
    }
}
