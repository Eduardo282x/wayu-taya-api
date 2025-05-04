import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { DocumentosService } from './documentos.service';
import { DocumentoDTO } from './documentos.dto';

@Controller('documentos')
export class DocumentosController {

    constructor(private documentoService: DocumentosService) {}

    @Get()
    async getDocumentos() {
        return await this.documentoService.getDocumentos()
    }
    
    @Post()
    async createDocumento(@Body() datos: DocumentoDTO) {
        return await this.documentoService.createDocumento(datos);
    }

    @Put('/:id')
    async updateDocumento(@Param('id') id_documento: string, @Body() datos: DocumentoDTO) {
        return await this.documentoService.updateDocumento(Number(id_documento), datos);
    }
    
    @Delete('/:id')
    async deleteDocumento(@Param('id') id_documento: string) {
        return await this.documentoService.deleteDocumento(Number(id_documento));
    }
}
