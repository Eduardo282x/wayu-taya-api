import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DTOUsuarios, DTOUsuariosPassword } from './usuarios.dto';

@Injectable()
export class UsuariosService {
  constructor(private readonly prismaService: PrismaService) {}

  async getUsers() {
    return this.prismaService.users.findMany({
      include: { rol: true },
    });
  }
  async getRoles() {
    return this.prismaService.role.findMany();
  }

  async createUser(username: DTOUsuarios) {
    try {
      await this.prismaService.users.create({
        data: {
          username: username.username,
          name: username.name,
          lastName: username.lastName,
          password: '1234',
          rolId: username.rolId,
          correo: username.correo,
        },
      });

      return { message: 'Usuario creado exitosamente' };
    } catch (err) {
      throw err;
    }
  }

  async updateUserPassword(id: number, newPassword: DTOUsuariosPassword) {
    try {
      await this.prismaService.users.update({
        data: {
          password: newPassword.newPassword,
        },
        where: { id },
      });

      return { message: 'Contraseña actualizada exitosamente' };
    } catch (err) {
      throw err;
    }
  }

  async updateProfile(id: number, username: DTOUsuarios) {
    try {
      await this.prismaService.users.update({
        data: {
          username: username.username,
          name: username.name,
          lastName: username.lastName,
          correo: username.correo,
        },
        where: { id },
        include: {
          rol: true,
        },
      });

      return { message: `Perfil Actualizado.` };
    } catch (err) {
      throw err;
    }
  }

  async updateUser(id_usuario: number, username: DTOUsuarios) {
    try {
      await this.prismaService.users.update({
        data: {
          username: username.username,
          name: username.name,
          lastName: username.lastName,
          correo: username.correo,
          rolId: username.rolId,
        },
        where: { id: id_usuario },
      });

      return { message: 'Usuario actualizado exitosamente' };
    } catch (err) {
      throw err;
    }
  }

  async deleteUser(id_usuario: number) {
    try {
      await this.prismaService.users.delete({
        where: { id: id_usuario },
      });

      return { message: 'Usuario eliminado exitosamente' };
    } catch (err) {
      throw err;
    }
  }
}
