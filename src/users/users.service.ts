import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

import { PrismaService } from 'src/prisma/prisma.service';
import { ProfileDTO, UserDTO, UserPasswordDTO } from './users.dto';

const BCRYPT_ROUNDS = 12;

/**
 * Proyección de respuesta. NUNCA devolver la fila completa: `password` es
 * un hash bcrypt y filtrarlo en la respuesta HTTP es una fuga de credenciales.
 */
const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  lastName: true,
  correo: true,
  username: true,
  rol: { select: { rol: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers() {
    const users = await this.prisma.users.findMany({
      select: USER_PUBLIC_SELECT,
      where: { deleted: false },
      orderBy: { id: 'asc' },
      take: 200,
    });

    return { users };
  }

  async getRoles() {
    const roles = await this.prisma.role.findMany({ orderBy: { id: 'asc' } });
    return { roles };
  }

  async createUser(dto: UserDTO) {
    // Si no se envía contraseña, se genera una aleatoria: el usuario deberá
    // usar el flujo de recuperación. Antes se fijaba '1234' en texto plano.
    const plaintext = dto.password ?? randomPassword();

    const existing = await this.prisma.users.findFirst({
      where: {
        OR: [{ username: dto.username }, { correo: dto.correo }],
      },
      select: { username: true, correo: true },
    });

    if (existing) {
      if (existing.username === dto.username) {
        throw new ConflictException('El nombre de usuario ya está registrado');
      }
      throw new ConflictException('El correo ya está registrado');
    }

    const user = await this.prisma.users.create({
      data: {
        username: dto.username,
        name: dto.name,
        lastName: dto.lastName,
        correo: dto.correo,
        rolId: dto.rolId,
        password: await bcrypt.hash(plaintext, BCRYPT_ROUNDS),
      },
      select: USER_PUBLIC_SELECT,
    });

    // La contraseña en claro solo se devuelve en la creación, y únicamente
    // para que el administrador la comunique. Nunca en listados ni updates.
    return {
      user,
      temporaryPassword: dto.password ? undefined : plaintext,
      message: 'Usuario creado exitosamente',
    };
  }

  async updateUserPassword(id: number, dto: UserPasswordDTO) {
    // Antes: `data: { password: dto.newPassword }` -> TEXTO PLANO en la BD.
    const password = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    const user = await this.prisma.users.update({
      where: { id },
      data: { password, passwordChangedAt: new Date() },
      select: USER_PUBLIC_SELECT, // no devuelve el hash
    });

    // Invalida las sesiones abiertas tras un reset administrativo de contraseña.
    await this.prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { user, message: 'Contraseña actualizada exitosamente' };
  }

  async updateProfile(id: number, dto: ProfileDTO) {
    const user = await this.prisma.users.update({
      where: { id },
      data: { username: dto.username, name: dto.name, lastName: dto.lastName },
      select: USER_PUBLIC_SELECT,
    });

    return { user, message: 'Perfil actualizado correctamente' };
  }

  async updateUser(id: number, dto: UserDTO) {
    if (!dto.rolId) {
      throw new BadRequestException('El rol es requerido');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: dto.rolId },
      select: { id: true },
    });
    if (!role) throw new BadRequestException('El rol indicado no existe');

    const user = await this.prisma.users.update({
      where: { id },
      data: {
        username: dto.username,
        name: dto.name,
        lastName: dto.lastName,
        correo: dto.correo,
        rolId: dto.rolId,
      },
      select: USER_PUBLIC_SELECT,
    });

    return { user, message: 'Usuario actualizado exitosamente' };
  }

  /** Soft delete. Revoca además cualquier sesión viva del usuario. */
  async deleteUser(id: number) {
    const user = await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.users.update({
        where: { id },
        data: { deleted: true },
        select: USER_PUBLIC_SELECT,
      });
      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return deleted;
    });

    return { user, message: 'Usuario eliminado exitosamente' };
  }

  async findById(id: number) {
    const user = await this.prisma.users.findFirst({
      where: { id, deleted: false },
      select: USER_PUBLIC_SELECT,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}

function randomPassword(): string {
  // Sin caracteres ambiguos (0/O, 1/l/I) para evitar errores de transcripción.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from(randomBytes(16), (b) => chars[b % chars.length]).join('');
}
