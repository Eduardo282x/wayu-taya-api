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

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaResult = this.handlePrismaError(exception);
      statusCode = prismaResult.statusCode;
      message = prismaResult.message;
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
      requestBody: undefined,
    });

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const { statusCode: prismaStatus, message: prismaMessage } =
        this.handlePrismaError(exception);
      response.status(prismaStatus).json({
        success: false,
        statusCode: prismaStatus,
        message: prismaMessage,
        data: {
          code: exception.code,
          exceptionMessage: exception.message,
        },
      });
      return;
    }

    const httpResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const errorMessage =
      exception instanceof HttpException
        ? typeof httpResponse === 'string'
          ? httpResponse
          : httpResponse?.['message'] || exception.message
        : 'Error interno del servidor';

    const data =
      exception instanceof HttpException
        ? typeof httpResponse === 'string'
          ? { detail: httpResponse }
          : {
              ...httpResponse,
              exceptionMessage: exception.message,
            }
        : {
            exceptionMessage: exception?.message,
            stack: exception?.stack,
          };

    response.status(statusCode).json({
      success: false,
      statusCode,
      message: Array.isArray(errorMessage) ? errorMessage[0] : errorMessage,
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
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Error de base de datos: ${exception.message}`,
        };
    }
  }
}
