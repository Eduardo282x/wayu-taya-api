import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

interface AttemptRecord {
  count: number;
  until: number;
}

/**
 * Lockout de fuerza bruta en memoria (5 intentos / 15 min por clave).
 *
 * NOTA: válido para despliegues de UNA SOLA instancia. Si se despliega con
 * varias réplicas (PM2 cluster, Kubernetes) migrar a Redis vía
 * `ThrottlerStorage` de @nestjs/throttler, o los contadores se dividirán por réplica.
 */
@Injectable()
export class LoginAttemptService implements OnModuleInit, OnModuleDestroy {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly WINDOW_MS = 15 * 60 * 1000;
  private static readonly PURGE_INTERVAL_MS = 60_000;
  private static readonly MAX_ENTRIES = 10_000;
  private readonly attempts = new Map<string, AttemptRecord>();
  private purgeTimer?: NodeJS.Timeout;

  onModuleInit(): void {
    this.purgeTimer = setInterval(
      () => this.purgeExpired(),
      LoginAttemptService.PURGE_INTERVAL_MS,
    );
    this.purgeTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.purgeTimer) clearInterval(this.purgeTimer);
  }

  private static key(username: string, ip?: string): string {
    return `${username.toLowerCase()}::${ip ?? 'unknown'}`;
  }

  assertNotLocked(username: string, ip?: string): void {
    const rec = this.attempts.get(LoginAttemptService.key(username, ip));
    if (
      rec &&
      rec.count >= LoginAttemptService.MAX_ATTEMPTS &&
      rec.until > Date.now()
    ) {
      const retryAfterMin = Math.ceil((rec.until - Date.now()) / 60_000);
      throw new HttpException(
        `Demasiados intentos fallidos. Intenta de nuevo en ${retryAfterMin} minuto(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  registerFailure(username: string, ip?: string): void {
    const key = LoginAttemptService.key(username, ip);
    const rec = this.attempts.get(key) ?? { count: 0, until: 0 };

    if (rec.until <= Date.now()) {
      rec.count = 0;
    }
    rec.count += 1;
    rec.until = Date.now() + LoginAttemptService.WINDOW_MS;

    // Cota dura: si el Map supera el máximo, se expulsan las entradas que
    // expiran antes (las más antiguas) para que la memoria no crezca sin fin
    // ante un ataque distribuido por usuario/IP.
    if (this.attempts.size >= LoginAttemptService.MAX_ENTRIES) {
      this.evictOldest();
    }
    this.attempts.set(key, rec);
  }

  registerSuccess(username: string, ip?: string): void {
    this.attempts.delete(LoginAttemptService.key(username, ip));
  }

  /** Purga entradas expiradas para que el Map no crezca sin límite. */
  purgeExpired(): void {
    const now = Date.now();
    for (const [key, rec] of this.attempts) {
      if (rec.until <= now) this.attempts.delete(key);
    }
  }

  /** Elimina la entrada que expira antes (la más antigua). */
  private evictOldest(): void {
    let oldestKey: string | undefined;
    let oldestExpiry = Infinity;
    for (const [key, rec] of this.attempts) {
      if (rec.until < oldestExpiry) {
        oldestExpiry = rec.until;
        oldestKey = key;
      }
    }
    if (oldestKey !== undefined) this.attempts.delete(oldestKey);
  }
}
