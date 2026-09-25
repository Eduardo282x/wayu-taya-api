// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { FileLoggerService } from '../logger/file-logger.service';
import { Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(FileLoggerService) private readonly logger: FileLoggerService,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<Request>();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';

    let statusCode: number;
    let message: string;
    // Detalle técnico SOLO para el log del servidor, nunca para el cliente.
    let internalDetail: string | undefined;

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaResult = this.handlePrismaError(exception);
      statusCode = prismaResult.statusCode;
      message = prismaResult.message;
      internalDetail = `prisma ${exception.code}: ${exception.message}`;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const httpResponse = exception.getResponse();
      message =
        typeof httpResponse === 'string'
          ? httpResponse
          : (httpResponse as any)?.['message'] || exception.message;
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Error interno del servidor';
      internalDetail = exception?.message;
    }

    this.logger.error({
      timestamp: new Date(),
      level: 'ERROR',
      method,
      url,
      statusCode,
      ip: ip || request.socket?.remoteAddress || 'N/A',
      userAgent,
      message: Array.isArray(message) ? message[0] : message,
      // El stack se registra en el log, no se devuelve en la respuesta.
      stack: exception instanceof HttpException ? undefined : exception?.stack,
      internalDetail,
      requestBody: undefined,
    });

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // NO se envían `code` ni `exception.message` de Prisma: revelan nombres
      // de tabla, columna y restricciones.
      response.status(statusCode).json({
        success: false,
        statusCode,
        message,
        data: null,
      });
      return;
    }

    const httpResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    // FUGA CORREGIDA: antes se devolvía `exception.stack` al cliente en
    // cualquier error 500, exponiendo rutas del servidor y estructura interna.
    const data =
      exception instanceof HttpException
        ? typeof httpResponse === 'string'
          ? { detail: httpResponse }
          : { ...httpResponse }
        : { detail: 'Error interno del servidor' };

    response.status(statusCode).json({
      success: false,
      statusCode,
      message: Array.isArray(message) ? message[0] : message,
      data,
    });
  }

  private handlePrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    statusCode: number;
    message: string;
  } {
    const target = (exception.meta?.target as string[])?.join(', ');

    switch (exception.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `Ya existe un registro con estos datos${target ? ` en el campo: ${target}` : ''}`,
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `El registro solicitado no fue encontrado o ya no existe`,
        };
      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Violación de integridad referencial: el registro relacionado no existe`,
        };
      case 'P2014':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `La operación requiere un registro relacionado que no existe`,
        };
      case 'P2011':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Violación de restricción NOT NULL: un campo obligatorio está vacío`,
        };
      case 'P2012':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Falta un valor requerido en un campo obligatorio`,
        };
      case 'P2013':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Los argumentos proporcionados son inválidos para la operación`,
        };
      case 'P2015':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `No se encontró un registro requerido para completar la operación`,
        };
      case 'P2016':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Error al interpretar la consulta: los datos no coinciden con lo esperado`,
        };
      case 'P2017':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Las filas solicitadas no están conectadas en la base de datos`,
        };
      case 'P2018':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Los campos de conexión requeridos faltan en los datos proporcionados`,
        };
      case 'P2019':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Error de entrada: los datos proporcionados no son válidos`,
        };
      case 'P2020':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `El valor proporcionado fuera del rango permitido`,
        };
      case 'P2021':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `La tabla o columna especificada no existe en la base de datos`,
        };
      case 'P2022':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `La columna especificada existe pero no puede ser accedida`,
        };
      case 'P2023':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Error en la consulta SQL generada: los datos son inconsistentes`,
        };
      case 'P2024':
        return {
          statusCode: HttpStatus.REQUEST_TIMEOUT,
          message: `La operación de base de datos tardó demasiado y fue cancelada`,
        };
      case 'P2026':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `El proveedor de base de datos no soporta esta operación`,
        };
      case 'P2027':
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Múltiples errores ocurrieron durante la consulta a la base de datos`,
        };
      case 'P2028':
        return {
          statusCode: HttpStatus.REQUEST_TIMEOUT,
          message: `Se excedió el límite de logs de la transacción`,
        };
      case 'P2029':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Se excedió el límite de parámetros de consulta en la base de datos`,
        };
      case 'P2030':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `No hay suficiente espacio disponible en la base de datos`,
        };
      case 'P2031':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `La base de datos no tiene suficiente memoria para completar la consulta`,
        };
      case 'P2033':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `La consulta generó un número que no puede ser representado`,
        };
      case 'P2034':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Se produjo un error de precisión decimal en la base de datos`,
        };
      default:
        this.logger.error(
          `Prisma error no mapeado ${exception.code}: ${exception.message}`,
        );
        // Antes devolvía `Error de base de datos: ${exception.message}`, que
        // filtraba nombres de tabla, columna y restricciones al cliente.
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno de la base de datos',
        };
    }
  }
}
