import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { FileLoggerService } from '../logger/file-logger.service';
import { getAuditContext } from 'src/audit/audit.context';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: FileLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const { method, url, ip, headers, body } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // Solo se registran peticiones exitosas: los errores ya los persiste
    // `AllExceptionsFilter`, y loguearlos aquí los duplicaría.
    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          const statusCode = response.statusCode;
          const auditContext = getAuditContext();
          const requestId =
            auditContext?.requestId ??
            (request as Request & { requestId?: string }).requestId;

          this.logger.log({
            timestamp: new Date(),
            level: 'INFO',
            method,
            url,
            statusCode,
            responseTime,
            ip: ip || request.socket?.remoteAddress || 'N/A',
            userAgent,
            requestId,
            userId: auditContext?.user?.sub,
            username: auditContext?.user?.username,
            message: `${method} ${url} completado`,
            requestBody: this.shouldLogBody(method, url) ? body : undefined,
            responseSize:
              Number(response.getHeader('content-length')) || undefined,
          });
        },
      }),
    );
  }

  private shouldLogBody(method: string, url: string): boolean {
    if (method === 'GET' || method === 'DELETE') return false;

    if (url.includes('/auth/')) return false;

    return true;
  }
}
