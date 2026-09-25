import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { basename, extname, isAbsolute, resolve, sep } from 'path';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { DocumentsService } from './documents.service';
import { DocumentDTO, NewDocumentDTO } from './documents.dto';

/** Raíz de los ficheros subidos. Toda ruta de descarga se valida contra ella. */
const UPLOADS_ROOT = resolve(process.cwd(), 'uploads');

/** Tipos y extensiones permitidos. Se valida el MIME, no solo la extensión. */
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const ALLOWED_EXT = new Set([
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.doc',
  '.docx',
  '.xlsx',
]);

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Resuelve `filePath` (viniendo de la BD) dentro de uploads/ y garantiza que
 * no escapa del directorio. `filePath` proviene de una columna que en versiones
 * anteriores guardaba la ruta ABSOLUTA del servidor, y ahora se guarda relativa,
 * así que se aceptan ambos formatos.
 */
export function resolveWithinUploads(filePath: string): string {
  const candidate = isAbsolute(filePath)
    ? resolve(filePath)
    : resolve(UPLOADS_ROOT, filePath);

  if (candidate !== UPLOADS_ROOT && !candidate.startsWith(UPLOADS_ROOT + sep)) {
    throw new ForbiddenException('Ruta de archivo no permitida');
  }

  return candidate;
}

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentService: DocumentsService) {}

  @Get()
  async getDocuments() {
    return this.documentService.getDocuments();
  }

  @Get('/fixed')
  async getDocumentsFixed() {
    return this.documentService.getDocumentsFixed();
  }

  @Get('/download/:id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async downloadDocument(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const document = await this.documentService.findDocument(id);

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }
    if (!document.filePath) {
      throw new NotFoundException('El documento no tiene fichero asociado');
    }

    // Antes: join(process.cwd(), document.filePath). Con '../' en la columna
    // se podía leer cualquier fichero del servidor.
    const filePath = resolveWithinUploads(document.filePath);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado en el servidor');
    }

    // basename evita separadores de ruta en el nombre de descarga.
    return res.download(filePath, basename(document.name));
  }

  @Post()
  async createDocument(@Body() data: DocumentDTO) {
    return this.documentService.createDocument(data);
  }

  @Put('/:id')
  async updateDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: DocumentDTO,
  ) {
    return this.documentService.updateDocument(id, data);
  }

  @Delete('/:id')
  async deleteDocument(@Param('id', ParseIntPipe) id: number) {
    return this.documentService.deleteDocument(id);
  }

  @Post('/upload')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: resolve(UPLOADS_ROOT, 'documents'),
        // Nombre generado por el servidor con randomUUID. Nunca se usa
        // `originalname`, que está controlado por el cliente.
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          if (!ALLOWED_EXT.has(ext)) {
            return cb(
              new BadRequestException('Extensión de archivo no permitida'),
              '',
            );
          }
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      // Sin esto no hay techo de memoria ni de disco: DoS por relleno.
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.has(file.mimetype)) {
          return cb(
            new BadRequestException('Tipo de archivo no permitido'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: NewDocumentDTO,
  ) {
    return this.documentService.createFile(file, body);
  }

  @Get('/pdf/adulto')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async generateAdultPDF(@Res() res: Response) {
    const pdfBuffer = await this.documentService.generateAdultPDF();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        'attachment; filename=autorizacion_usodeimagen.pdf',
      'Content-Length': String(pdfBuffer.length),
    });

    return res.end(pdfBuffer);
  }

  @Get('/pdf/representante-legal')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async generateMinorPDF(@Res() res: Response) {
    const pdfBuffer = await this.documentService.generateMinorPDF();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        'attachment; filename=autorizacion_usodeimagen_representantelegal.pdf',
      'Content-Length': String(pdfBuffer.length),
    });

    return res.end(pdfBuffer);
  }
}
