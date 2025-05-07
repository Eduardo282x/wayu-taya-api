import { Injectable } from '@nestjs/common';
import { badResponse, baseResponse } from 'src/dto/base.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { DTOUsuarios } from './usuarios.dto';

@Injectable()
export class UsuariosService {

    constructor(private readonly prismaService: PrismaService) {

    }

    async getUsers() {
        return this.prismaService.usuarios.findMany()
    }

    async createUser(usuario: DTOUsuarios) {
        try {
            await this.prismaService.usuarios.create({
                data: {
                    usuario: usuario.usuario,
                    nombre: usuario.nombre,
                    apellido: usuario.apellido,
                    password: '1234',
                    correo: usuario.correo
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

    async updateUser(id_usuario: number, usuario: DTOUsuarios) {
        try {
            await this.prismaService.usuarios.update({
                data: {
                    usuario: usuario.usuario,
                    nombre: usuario.nombre,
                    apellido: usuario.apellido,
                    correo: usuario.correo
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
            await this.prismaService.usuarios.delete({
                where: { id: id_usuario }
            })

            baseResponse.message = 'Usuario eliminado exitosamente';
            return baseResponse;
        }
        catch (err) {
            badResponse.message = `Ha ocurrido un error ${err}`
            return badResponse
        }
    }
}
