import type { ConfigService } from '@nestjs/config';
import type { JwtSignOptions } from '@nestjs/jwt';

/**
 * `JwtSignOptions['expiresIn']` es `number | StringValue`, donde `StringValue`
 * es un subconjunto de literales que exporta el paquete `ms`. El valor llega
 * desde la configuración en runtime, así que se declara el tipo aquí y se
 * castea en un único punto, en lugar de repetir el cast en cada llamada.
 */
type DurationValue = NonNullable<JwtSignOptions['expiresIn']>;

export const DEFAULT_EXPIRES_IN = '15m';
export const DEFAULT_REFRESH_EXPIRES_IN = '7d';

export function signOptions(config: ConfigService): {
  expiresIn: DurationValue;
} {
  return {
    expiresIn: (config.get<string>('JWT_EXPIRES_IN') ??
      DEFAULT_EXPIRES_IN) as DurationValue,
  };
}

export function signOptionsWith(
  expiresIn: string,
): Pick<JwtSignOptions, 'expiresIn'> {
  return { expiresIn: expiresIn as DurationValue };
}

/** Convierte '7d' / '15m' / '3600' a milisegundos. */
export function parseDurationMs(value: string): number {
  const match = /^(\d+)\s*([smhd])?$/.exec(value.trim());
  if (!match) return 7 * 86_400_000;
  const factor = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[
    match[2] ?? 's'
  ];
  return Number(match[1]) * factor;
}

export function refreshTtlMs(config: ConfigService): number {
  return parseDurationMs(
    config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? DEFAULT_REFRESH_EXPIRES_IN,
  );
}
