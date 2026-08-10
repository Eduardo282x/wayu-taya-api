import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserDTO, UserPasswordDTO } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) { }

  async getUsers() {
    const users = await this.prismaService.users.findMany({
      include: { rol: true },
      where: { deleted: false },
    });

    return { users };
  }
  async getRoles() {
    const roles = await this.prismaService.role.findMany();

    return { roles };
  }

  async createUser(user: UserDTO) {
    try {
      const newUser = await this.prismaService.users.create({
        data: {
          username: user.username,
          name: user.name,
          lastName: user.lastName,
          password: '1234',
          rolId: user.rolId,
          correo: user.correo,
        },
      });

      return { user: newUser, message: 'Usuario creado exitosamente' };
    } catch (err) {
      throw err;
    }
  }

  async updateUserPassword(id: number, newPassword: UserPasswordDTO) {
    try {
      const userUpdated = await this.prismaService.users.update({
        data: {
          password: newPassword.newPassword,
        },
        where: { id },
      });

      return {
        user: userUpdated,
        message: 'Contraseña actualizada exitosamente',
      };
    } catch (err) {
      throw err;
    }
  }

  async updateProfile(id: number, user: UserDTO) {
    try {
      const userUpdated = await this.prismaService.users.update({
        data: {
          username: user.username,
          name: user.name,
          lastName: user.lastName,
          correo: user.correo,
        },
        where: { id },
        include: {
          rol: true,
        },
      });

      return { user: userUpdated, message: `Perfil Actualizado.` };
    } catch (err) {
      throw err;
    }
  }

  async updateUser(id_usuario: number, user: UserDTO) {
    try {
      const userUpdated = await this.prismaService.users.update({
        data: {
          username: user.username,
          name: user.name,
          lastName: user.lastName,
          correo: user.correo,
          rolId: user.rolId,
        },
        where: { id: id_usuario },
      });

      return { user: userUpdated, message: 'Usuario actualizado exitosamente' };
    } catch (err) {
      throw err;
    }
  }

  async deleteUser(id_usuario: number) {
    try {
      const userDeleted = await this.prismaService.users.update({
        data: { deleted: true },
        where: { id: id_usuario },
      });

      return { user: userDeleted, message: 'Usuario eliminado exitosamente' };
    } catch (err) {
      throw err;
    }
  }
}
