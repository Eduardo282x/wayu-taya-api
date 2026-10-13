import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

interface CacheEntry {
  value: Date | null;
  expiresAt: number;
}

/**
 * Cachea `Users.passwordChangedAt` por usuario para poder invalidar access
 * tokens emitidos antes del último cambio de contraseña SIN un `SELECT` por
 * petición.
 *
 * TTL corto (60 s): un cambio de contraseña invalida el token inmediatamente vía
 * `invalidate()`; el TTL solo acota la ventana de datos obsoletos si la
 * invalidación fallara. La purga periódica evita que el `Map` crezca sin límite.
 *
 * Limitación (decisión de la entrega): NO cubre cambios de rol. Un rol
 * degradado sigue vigente hasta que expira el access token (máx. 15 min).
 */
@Injectable()
export class PasswordChangedAtService implements OnModuleInit, OnModuleDestroy {
  private static readonly TTL_MS = 60_000;
  private static readonly MAX_ENTRIES = 10_000;
  private static readonly PURGE_INTERVAL_MS = 60_000;

  private readonly cache = new Map<number, CacheEntry>();
  private purgeTimer?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    this.purgeTimer = setInterval(
      () => this.purgeExpired(),
      PasswordChangedAtService.PURGE_INTERVAL_MS,
    );
    // No bloquea el cierre del proceso por un timer de fondo.
    this.purgeTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.purgeTimer) clearInterval(this.purgeTimer);
  }

  /** Fuerza la recarga en la próxima consulta (tras cambio/reset de contraseña). */
  invalidate(userId: number): void {
    this.cache.delete(userId);
  }

  /**
   * `true` si el access token (emitido en `iat`, segundos epoch) es anterior al
   * último cambio de contraseña del usuario.
   */
  async isTokenStale(userId: number, iat?: number): Promise<boolean> {
    if (!iat) return false;
    const changedAt = await this.getPasswordChangedAt(userId);
    return changedAt !== null && iat * 1000 < changedAt.getTime();
  }

  private async getPasswordChangedAt(userId: number): Promise<Date | null> {
    const now = Date.now();
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > now) return cached.value;

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { passwordChangedAt: true },
    });
    const value = user?.passwordChangedAt ?? null;

    if (this.cache.size >= PasswordChangedAtService.MAX_ENTRIES) {
      this.evictOldest();
    }
    this.cache.set(userId, {
      value,
      expiresAt: now + PasswordChangedAtService.TTL_MS,
    });
    return value;
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [userId, entry] of this.cache) {
      if (entry.expiresAt <= now) this.cache.delete(userId);
    }
  }

  private evictOldest(): void {
    let oldestKey: number | undefined;
    let oldestExpiry = Infinity;
    for (const [userId, entry] of this.cache) {
      if (entry.expiresAt < oldestExpiry) {
        oldestExpiry = entry.expiresAt;
        oldestKey = userId;
      }
    }
    if (oldestKey !== undefined) this.cache.delete(oldestKey);
  }
}
