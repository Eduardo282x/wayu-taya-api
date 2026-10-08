import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { AuditEntry, GetAuditQueryDTO } from './audit.dto';
import { getAuditContext } from './audit.context';

/**
 * Escribe la bitácora de auditoría.
 *
 * `record()` acepta el `tx` de la transacción en curso para que el log sea
 * atómico con la operación: si la operación falla, el log también se revierte.
 * El usuario/IP/user-agent se toman del contexto async de la petición.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    entry: AuditEntry,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const db = tx ?? this.prisma;
    const ctx = getAuditContext();
    const user = ctx?.user;

    await db.auditLog.create({
      data: {
        userId: user?.sub ?? null,
        username: user?.username ?? '',
        userRole: user?.rol ?? '',
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        description: entry.description ?? '',
        metadata:
          entry.metadata == null
            ? undefined
            : (entry.metadata as Prisma.InputJsonValue),
        ip: ctx?.ip ?? null,
        userAgent: ctx?.userAgent ?? null,
      },
    });
  }

  async getLogs(query?: GetAuditQueryDTO) {
    const page = query?.page ?? 1;
    const size = query?.size ?? 50;

    const where: Prisma.AuditLogWhereInput = {};
    if (query?.userId) where.userId = query.userId;
    if (query?.action) where.action = query.action;
    if (query?.entity) where.entity = query.entity;
    if (query?.entityId) where.entityId = query.entityId;
    if (query?.from || query?.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = query.from;
      if (query.to) where.createdAt.lte = query.to;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  async getLog(id: number) {
    return this.prisma.auditLog.findUnique({ where: { id } });
  }
}
