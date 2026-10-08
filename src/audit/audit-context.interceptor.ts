import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, Subscription } from 'rxjs';
import { Request } from 'express';
import { JwtPayload } from 'src/auth/auth.types';
import { auditContextStorage } from './audit.context';

/**
 * Envuelve cada petición HTTP en un contexto async con el usuario autenticado
 * (colocado en `request.user` por `AuthGuard`), la IP y el user-agent.
 *
 * Los servicios de negocio pueden leerlo con `AuditService.record()` sin
 * recibir el usuario por parámetro. El contexto debe establecerse dentro de la
 * suscripción del observable para sobrevivir a los `await` del handler.
 */
@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const store = {
      user: request['user'] as JwtPayload | undefined,
      ip: request.ip || request.socket?.remoteAddress,
      userAgent: request.headers['user-agent'],
    };

    return new Observable((subscriber) => {
      let subscription: Subscription | undefined;
      auditContextStorage.run(store, () => {
        subscription = next.handle().subscribe(subscriber);
      });
      return () => subscription?.unsubscribe();
    });
  }
}
