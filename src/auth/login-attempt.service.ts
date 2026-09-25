import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

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
export class LoginAttemptService {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly WINDOW_MS = 15 * 60 * 1000;
  private readonly attempts = new Map<string, AttemptRecord>();

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
}
