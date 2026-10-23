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
import { AuditService } from 'src/audit/audit.service';
import { getAuditContext } from 'src/audit/audit.context';

type RequestWithContext = Request & {
  requestId?: string;
  user?: { sub?: number; username?: string; rol?: string };
};

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SENSITIVE_ROUTES = ['/auth/'];

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(FileLoggerService) private readonly logger: FileLoggerService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<RequestWithContext>();
    const auditContext = getAuditContext();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const requestId =
      request.requestId ??
      (typeof headers['x-request-id'] === 'string'
        ? headers['x-request-id']
        : auditContext?.requestId);
    const user = request.user ?? auditContext?.user;
    const isSensitiveRoute = SENSITIVE_ROUTES.some((route) =>
      url.includes(route),
    );
    const shouldLogPayload = MUTATING_METHODS.has(method) && !isSensitiveRoute;
    const shouldAuditFailure =
      MUTATING_METHODS.has(method) && !isSensitiveRoute;

    const uploadFile = (
      request as Request & {
        file?: { originalname?: string; size?: number; mimetype?: string };
      }
    ).file;
    const requestPayload = request.is('multipart/form-data')
      ? uploadFile
        ? {
            file: {
              originalname: uploadFile.originalname ?? '',
              size: uploadFile.size ?? 0,
              mimetype: uploadFile.mimetype ?? '',
            },
          }
        : null
      : (request.body ?? null);

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

    const safeMessage = Array.isArray(message) ? message[0] : message;

    this.logger.error({
      timestamp: new Date(),
      level: 'ERROR',
      method,
      url,
      statusCode,
      ip: ip || request.socket?.remoteAddress || 'N/A',
      userAgent,
      requestId,
      userId: user?.sub,
      username: user?.username,
      message: safeMessage,
      // El stack se registra en el log, no se devuelve en la respuesta.
      stack: exception instanceof HttpException ? undefined : exception?.stack,
      internalDetail,
      requestBody: shouldLogPayload ? requestPayload : undefined,
    });

    // El fallo se audita con la conexión principal: sobrevive al rollback de
    // la transacción que originó el error. Si la auditoría falla, se registra
    // el problema pero nunca se oculta la excepción original.
    if (shouldAuditFailure) {
      try {
        await this.auditService.recordFailure(
          {
            action: 'FAILED',
            entity: this.resolveEntity(url),
            entityId: null,
            description: `Intento fallido ${method} ${url} (${statusCode}): ${safeMessage}`,
            metadata: {
              statusCode,
              message: safeMessage,
              requestId: requestId ?? null,
              method,
              url,
              payload: shouldLogPayload ? requestPayload : null,
              errorName: exception?.constructor?.name ?? 'Error',
            },
          },
          {
            user: user as any,
            ip: ip || request.socket?.remoteAddress,
            userAgent,
            requestId,
          },
        );
      } catch (auditError) {
        this.logger.error({
          timestamp: new Date(),
          level: 'ERROR',
          method,
          url,
          statusCode,
          requestId,
          userId: user?.sub,
          username: user?.username,
          message: 'No se pudo registrar el fallo en auditoría',
          internalDetail:
            auditError instanceof Error
              ? auditError.message
              : String(auditError),
        });
      }
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // NO se envían `code` ni `exception.message` de Prisma: revelan nombres
      // de tabla, columna y restricciones.
      response.status(statusCode).json({
        success: false,
        statusCode,
        message,
        data: { requestId: requestId ?? null },
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
          ? { detail: httpResponse, requestId: requestId ?? null }
          : { ...httpResponse, requestId: requestId ?? null }
        : {
            detail: 'Error interno del servidor',
            requestId: requestId ?? null,
          };

    response.status(statusCode).json({
      success: false,
      statusCode,
      message: safeMessage,
      data,
    });
  }

  /** Entidad lógica de auditoría a partir de la ruta HTTP. */
  private resolveEntity(url: string): string {
    const path = url.split('?')[0];
    const mappings: { segment: string; entity: string }[] = [
      { segment: '/donations', entity: 'Donation' },
      { segment: '/medicine', entity: 'Medicine' },
      { segment: '/inventory', entity: 'Inventory' },
      { segment: '/store', entity: 'Store' },
      { segment: '/providers', entity: 'Provider' },
      { segment: '/institutions', entity: 'Institution' },
      { segment: '/people', entity: 'People' },
      { segment: '/events', entity: 'Event' },
      { segment: '/documents', entity: 'Document' },
      { segment: '/users', entity: 'User' },
    ];
    const match = mappings.find(({ segment }) => path.includes(segment));
    return match?.entity ?? 'HttpRequest';
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
          message: `La operación tardó demasiado y fue cancelada. No se guardó nada; intenta de nuevo.`,
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
          statusCode: HttpStatus.CONFLICT,
          message: `Otro usuario estaba actualizando el inventario al mismo tiempo. No se guardó nada; intenta de nuevo.`,
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
