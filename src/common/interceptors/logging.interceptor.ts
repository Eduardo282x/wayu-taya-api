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

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: FileLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const { method, url, ip, headers, body } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logger.log({
            timestamp: new Date(),
            level: 'INFO',
            method,
            url,
            statusCode,
            responseTime,
            ip: ip || request.socket?.remoteAddress || 'N/A',
            userAgent,
            message: `${method} ${url} completado`,
            requestBody: this.shouldLogBody(method, url) ? body : undefined,
            responseSize:
              Number(response.getHeader('content-length')) || undefined,
          });
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          const statusCode = error.getStatus ? error.getStatus() : 500;

          this.logger.error({
            timestamp: new Date(),
            level: 'ERROR',
            method,
            url,
            statusCode,
            responseTime,
            ip: ip || request.socket?.remoteAddress || 'N/A',
            userAgent,
            message: error.message || 'Error interno del servidor',
            requestBody: this.shouldLogBody(method, url) ? body : undefined,
          });
        },
      }),
    );
  }

  private shouldLogBody(method: string, url: string): boolean {
    if (method === 'GET' || method === 'DELETE') return false;

    const sensitiveUrls = ['/auth/login', '/auth/register', '/auth/refresh'];
    if (sensitiveUrls.some((sensitiveUrl) => url.includes(sensitiveUrl)))
      return false;

    return true;
  }
}
