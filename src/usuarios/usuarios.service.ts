import { Injectable } from '@nestjs/common';
import { badResponse, baseResponse } from 'src/dto/base.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { DTOUsuarios } from './usuarios.dto';

@Injectable()
export class UsuariosService {

    constructor(private readonly prismaService: PrismaService) {

    }

    async getUsers() {
        return this.prismaService.users.findMany()
    }

    async createUser(username: DTOUsuarios) {
        try {
            await this.prismaService.users.create({
                data: {
                    username: username.username,
                    name: username.name,
                    lastName: username.lastName,
                    password: '1234',
                    correo: username.correo
                }
            })

            baseResponse.message = 'Usuario creado exitosamente';
            return baseResponse;
        }
        catch (err) {
            badResponse.message = `Ha ocurrido un error creando el usuario: ${err}`
            return badResponse
        }
    }

    async updateUser(id_usuario: number, username: DTOUsuarios) {
        try {
            await this.prismaService.users.update({
                data: {
                    username: username.username,
                    name: username.name,
                    lastName: username.lastName,
                    correo: username.correo
                },
                where: { id: id_usuario }
            })

            baseResponse.message = 'Usuario actualizado exitosamente';
            return baseResponse;
        }
        catch (err) {
            badResponse.message = `Ha ocurrido un error actualizando el usuario: ${err}`
            return badResponse
        }
    }

    async deleteUser(id_usuario: number) {
        try {
            await this.prismaService.users.delete({
                where: { id: id_usuario }
            })

            baseResponse.message = 'Usuario eliminado exitosamente';
            return baseResponse;
        }
        catch (err) {
            badResponse.message = `Ha ocurrido un error al eliminar el usuario: ${err}`
            return badResponse
        }
    }
}
