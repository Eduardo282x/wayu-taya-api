// src/common/interceptors/response.interceptor.ts
import {
  Injectable,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((res) => {
        // Las respuestas binarias (StreamableFile) NO se envuelven: Nest las
        // escribe tal cual con sus cabeceras.
        if (res instanceof StreamableFile) {
          return res;
        }

        // 1. Extraemos el mensaje si existe, de lo contrario vacío
        const message = res?.message || '';

        // 2. Determinamos qué es la "data" real
        let finalData = res;

        // Si 'res' es un objeto y tiene una propiedad 'data' interna (como hicimos en el service)
        if (res && typeof res === 'object' && 'data' in res) {
          finalData = res.data;
        } else if (res && typeof res === 'object') {
          // Si 'res' es el objeto directo pero tiene el message incluido, lo clonamos sin el message
          const { message: _, ...rest } = res;
          // Si el objeto resultante está vacío (porque solo tenía el message), data es null
          finalData = Object.keys(rest).length > 0 ? rest : null;
        }

        return {
          success: true,
          statusCode: statusCode,
          message: message,
          data: finalData,
        };
      }),
    );
  }
}
