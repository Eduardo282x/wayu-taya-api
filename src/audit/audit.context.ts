import { AsyncLocalStorage } from 'async_hooks';
import { JwtPayload } from 'src/auth/auth.types';

/**
 * Datos de la petición actual que necesita la auditoría (usuario, IP, UA).
 * Se propaga vía AsyncLocalStorage para no cambiar la firma de los servicios.
 */
export interface AuditContextStore {
  user?: JwtPayload;
  ip?: string;
  userAgent?: string;
}

export const auditContextStorage = new AsyncLocalStorage<AuditContextStore>();

export function getAuditContext(): AuditContextStore | undefined {
  return auditContextStorage.getStore();
}
