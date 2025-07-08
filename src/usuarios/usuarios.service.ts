import { Injectable } from '@nestjs/common';
import { badResponse, baseResponse, BaseResponseLogin } from 'src/dto/base.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { DTOUsuarios, DTOUsuariosPassword } from './usuarios.dto';

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
                    rolId: 2,
                    correo: username.correo
                }
            })

            baseResponse.message = 'Usuario creado exitosamente';
            return baseResponse;
        }
        catch (err) {
            badResponse.message = `Ha ocurrido un error ${err}`
            return badResponse
        }
    }

    async updateUserPassword(id: number, newPassword: DTOUsuariosPassword) {
        try {
            await this.prismaService.users.update({
                data: {
                    password: newPassword.newPassword,
                },
                where: { id }
            })

            baseResponse.message = 'Contraseña actualizada exitosamente';
            return baseResponse;
        }
        catch (err) {
            badResponse.message = `Ha ocurrido un error ${err}`
            return badResponse
        }
    }

    async updateProfile(id: number, username: DTOUsuarios) {
        try {
            const userUpdated = await this.prismaService.users.update({
                data: {
                    username: username.username,
                    name: username.name,
                    lastName: username.lastName,
                    correo: username.correo
                },
                where: { id },
                include: {
                    rol: true
                }
            })

            const responseLogin: BaseResponseLogin = {
                ...baseResponse,
                token: JSON.stringify(userUpdated)
            }

            responseLogin.message = `Perfil Actualizado.`
            return responseLogin
        }
        catch (err) {
            badResponse.message = `Ha ocurrido un error ${err}`
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
            badResponse.message = `Ha ocurrido un error ${err}`
            return badResponse
        }
    }

    async deleteUser(id_usuario: number) {
        try {
            await this.prismaService.users.delete({
                where: { id: id_usuario }
            })

            baseResponse.message = 'Usuario deleted exitosamente';
            return baseResponse;
        }
        catch (err) {
            badResponse.message = `Ha ocurrido un error ${err}`
            return badResponse
        }
    }
}
