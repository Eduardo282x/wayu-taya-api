import { Global, Module } from '@nestjs/common';
import { FileLoggerService } from './file-logger.service';

/**
 * Global a propósito: `FileLoggerService` se inyecta en servicios de múltiples
 * módulos (donations, inventory, reports, documents) y en `LoggingInterceptor`.
 * Declararlo en cada módulo crearía una instancia distinta por módulo (y por
 * tanto varios escritores sobre los mismos archivos de log).
 */
@Global()
@Module({
  providers: [FileLoggerService],
  exports: [FileLoggerService],
})
export class LoggerModule {}
