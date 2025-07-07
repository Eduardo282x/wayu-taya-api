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
