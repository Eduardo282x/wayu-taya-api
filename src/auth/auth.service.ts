import { Injectable } from '@nestjs/common';
import { badResponse, baseResponse, BaseResponseLogin } from 'src/dto/base.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { DTOLogin, DTORecoverPassword } from './auth.dto';

@Injectable()
export class AuthService {

    constructor(private readonly prismaService: PrismaService) {

    }

    async authLogin(login: DTOLogin) {
        try {
            const findUser = await this.prismaService.users.findFirst({
                where: {
                    username: login.username,
                    password: login.password
                }
            })

            if (!findUser) {
                badResponse.message = 'Usuario no encontrado.'
                return badResponse;
            }

            const responseLogin: BaseResponseLogin = {
                ...baseResponse,
                token: JSON.stringify(findUser)
            }

            responseLogin.message = `Bienvenido ${findUser.name} ${findUser.lastName}`
            return responseLogin
        } catch (error) {
            badResponse.message = `Ha ocurrido un error ${error}`;
            return badResponse;
        }
    }

    async changePassword(change: DTORecoverPassword) {
        try {
            const findUser = await this.prismaService.users.findFirst({
                where: { correo: change.email }
            });

            if (!findUser) {
                badResponse.message = `Correo no encontrado.`;
                return badResponse;
            }

            await this.prismaService.users.update({
                data: {
                    password: change.password
                },
                where: {
                    id: findUser.id
                }
            })

            baseResponse.message = `Contraseña recuperada.`
            return baseResponse
        } catch (error) {
            badResponse.message = `Ha ocurrido un error ${error}`;
            return badResponse;
        }
    }
}
