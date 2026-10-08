import { Global, Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

/**
 * Global: `AuditService` debe poder inyectarse en Donations, Inventory y
 * Medicine sin que cada módulo lo importe (mismo patrón que PrismaModule).
 */
@Global()
@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
