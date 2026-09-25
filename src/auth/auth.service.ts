import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/prisma/prisma.service';
import { LoginAttemptService } from './login-attempt.service';
import { JwtPayload } from './auth.types';
import { DTOLogin } from './auth.dto';
import {
  DEFAULT_EXPIRES_IN,
  refreshTtlMs,
  signOptionsWith,
} from './jwt.config';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 min

/**
 * Proyección del usuario. NUNCA incluir `password`: es un hash bcrypt y
 * filtrarlo en la respuesta HTTP es una fuga de credenciales.
 */
const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  lastName: true,
  correo: true,
  username: true,
  rolId: true,
  rol: { select: { rol: true } },
} as const;

/**
 * Hash bcrypt de una contraseña que nadie posee. Se compara contra él cuando
 * el usuario no existe, para que el tiempo de respuesta del login sea idéntico
 * exista o no la cuenta (evita enumeración de usuarios).
 */
const DUMMY_BCRYPT_HASH =
  '$2b$12$ofJgUoBCm05KnvHSfohH4.P3bxQQbFW0KIcWiGmXXDLAx2jIg8f7u';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly loginAttempts: LoginAttemptService,
  ) {}

  /**
   * Solo en desarrollo se permite escribir credenciales en los logs (por
   * ejemplo, el token de recuperacion, porque aun no hay proveedor de correo).
   * En produccion nunca.
   *
   * Es un getter y no un inicializador de campo a proposito: con
   * useDefineForClassFields (target ES2023) los inicializadores de campo se
   * ejecutan antes de asignar las parameter properties, y `this.config` todavia
   * seria undefined.
   */
  private get isDevelopment(): boolean {
    return this.config.get<string>('NODE_ENV') !== 'production';
  }

  // ─────────────────────────────── LOGIN ───────────────────────────────

  async authLogin(login: DTOLogin, ip?: string) {
    this.loginAttempts.assertNotLocked(login.username, ip);

    const user = await this.prisma.users.findFirst({
      where: { username: login.username, deleted: false },
      select: { ...USER_PUBLIC_SELECT, password: true },
    });

    // Se compara siempre, exista o no el usuario: mantiene constante el tiempo
    // de respuesta y evita revelar qué usernames están registrados.
    const hash = user?.password ?? DUMMY_BCRYPT_HASH;
    const isValid = await bcrypt.compare(login.password, hash);

    if (!user || !isValid) {
      this.loginAttempts.registerFailure(login.username, ip);
      // Mensaje único: no revela si el usuario existe ni si falla la clave.
      throw new UnauthorizedException('Credenciales inválidas');
    }

    this.loginAttempts.registerSuccess(login.username, ip);

    const accessToken = await this.signAccessToken(toPayload(user));
    const { token: refreshToken } = await this.issueRefreshToken(user.id);

    return {
      message: `¡Bienvenido, ${user.name}!`,
      user: toPublicUser(user),
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTtl(),
    };
  }

  // ────────────────────────────── REFRESH ──────────────────────────────

  async refresh(refreshToken: string) {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: { user: { select: { ...USER_PUBLIC_SELECT, deleted: true } } },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    if (record.user.deleted) {
      throw new UnauthorizedException('La cuenta está desactivada');
    }

    const now = new Date();

    if (record.revokedAt) {
      // Reutilización de un token ya rotado = posible robo. Se revoca la
      // familia completa para forzar un nuevo login en todas las sesiones.
      await this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: now },
      });
      throw new UnauthorizedException('Sesión revocada por seguridad');
    }

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: now },
    });

    const accessToken = await this.signAccessToken(toPayload(record.user));
    const next = await this.issueRefreshToken(record.userId);

    return {
      accessToken,
      refreshToken: next.token,
      tokenType: 'Bearer',
      expiresIn: this.accessTtl(),
      user: toPublicUser(record.user),
    };
  }

  // ────────────────────────────── LOGOUT ───────────────────────────────

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Sesión cerrada correctamente' };
  }

  // ─────────────────── RECUPERACIÓN DE CONTRASEÑA ────────────────────

  /**
   * PASO 1. NO cambia la contraseña: solo genera un token de un solo uso.
   *
   * Así el requisito "conocer el correo" queda separado del requisito
   * "poder entrar". Antes, este endpoint tomaba el control de CUALQUIER
   * cuenta con solo conocer su correo.
   */
  async requestPasswordReset(email: string) {
    const user = await this.prisma.users.findFirst({
      where: { correo: email, deleted: false },
      select: { id: true },
    });

    // SIEMPRE la misma respuesta: no revela si el correo está registrado.
    if (user) {
      const rawToken = randomBytes(32).toString('hex');
      const now = new Date();

      // El orden importa: primero se invalidan los tokens previos y LUEGO se
      // crea el nuevo. Al revés, el updateMany (usedAt: null) marcaba
      // también el token recién creado y el enlace quedaba inservible.
      await this.prisma.$transaction([
        this.prisma.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: now },
        }),
        this.prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: hashToken(rawToken),
            expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
          },
        }),
      ]);

      // No hay proveedor de correo configurado, asi que en DESARROLLO se
      // deja el token en el log para poder completar la prueba. En
      // PRODUCCION nunca se registra: un token en los logs es una credencial
      // filtrada. Sin integrate de correo, el enlace se entrega por otro
      // canal; este log es solo una ayuda de desarrollo.
      if (this.isDevelopment) {
        this.logger.warn(
          `PASSWORD RESET solicitado para userId=${user.id}. Token: ${rawToken}`,
        );
      } else {
        this.logger.warn(
          `PASSWORD RESET solicitado para userId=${user.id}. ` +
            `El token NO se registra en produccion: falta el proveedor de correo.`,
        );
      }
    }

    return {
      message:
        'Si el correo está registrado, recibirás un enlace para restablecer la contraseña.',
    };
  }

  /** PASO 2. Valida el token, cambia la contraseña e invalida las sesiones. */
  async confirmPasswordReset(token: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('El enlace es inválido o ha expirado');
    }

    const password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.users.update({
        where: { id: record.userId },
        data: { password, passwordChangedAt: now },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: now },
      }),
      // Cierra todas las sesiones abiertas de esa cuenta.
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);

    return { message: 'Contraseña actualizada correctamente' };
  }

  /** Cambio de contraseña autenticado: EXIGE la contraseña actual. */
  async changeOwnPassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.users.update({
        where: { id: userId },
        data: { password, passwordChangedAt: now },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);

    return { message: 'Contraseña actualizada correctamente' };
  }

  // ──────────────────────────── Helpers ────────────────────────────────

  private accessTtl(): string {
    return this.config.get<string>('JWT_EXPIRES_IN') ?? DEFAULT_EXPIRES_IN;
  }

  private signAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(
      payload,
      signOptionsWith(this.accessTtl()),
    );
  }

  private async issueRefreshToken(userId: number) {
    const token = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + refreshTtlMs(this.config));

    await this.prisma.refreshToken.create({
      data: { tokenHash: hashToken(token), userId, expiresAt },
    });

    return { token };
  }
}

type UserRow = {
  id: number;
  name: string;
  lastName: string;
  correo: string;
  username: string;
  rolId: number;
  rol: { rol: string } | null;
};

function toPayload(user: UserRow): JwtPayload {
  return {
    sub: user.id,
    username: user.username,
    name: user.name,
    lastName: user.lastName,
    rolId: user.rolId,
    rol: user.rol?.rol ?? '',
  };
}

function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    name: user.name,
    lastName: user.lastName,
    correo: user.correo,
    username: user.username,
    rol: user.rol?.rol ?? '',
  };
}

/** SHA-256 hexadecimal. El token en claro nunca se persiste. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
