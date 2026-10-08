import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Roles } from 'src/auth/roles.decorator';
import { AuditService } from './audit.service';
import { GetAuditQueryDTO } from './audit.dto';

/**
 * Consulta de la bitácora de auditoría. Solo administradores.
 */
@Roles('Super Admin', 'Administrador')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getLogs(@Query() query: GetAuditQueryDTO) {
    return this.auditService.getLogs(query);
  }

  @Get('/:id')
  async getLog(@Param('id', ParseIntPipe) id: number) {
    return this.auditService.getLog(id);
  }
}
