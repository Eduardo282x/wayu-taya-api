import { Injectable, UnauthorizedException } from '@nestjs/common';
import { badResponse, baseResponse, BaseResponseLogin } from 'src/dto/base.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { DTOLogin, DTORecoverPassword } from './auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async authLogin(login: DTOLogin) {
    try {
      const findUser = await this.prismaService.users.findFirst({
        where: {
          username: login.username,
        },
        include: {
          rol: true,
        },
      });

      // 2. Si no existe, lanzamos excepción (El Filter la atrapará)
      if (!findUser) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      // 3. Verificar contraseña con bcrypt
      const isValid = await bcrypt.compare(login.password, findUser.password);

      // 4. Si la contraseña no coincide, lanzamos la misma excepción
      if (!isValid) {
        throw new UnauthorizedException('Contraseña incorrecta');
      }

      // 5. Extraer la contraseña para no enviarla en el token ni en la respuesta
      const { password, ...userWithoutPassword } = findUser;

      // 6. El payload del token solo llevará los datos limpios

      const token = await this.jwtService.signAsync(userWithoutPassword);

      // 7. Retornamos los datos del usuario y el token
      // El Interceptor de Éxito los envolverá automáticamente
      return {
        message: `¡Bienvenido, ${userWithoutPassword.name}!`,
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  async changePassword(change: DTORecoverPassword) {
    try {
      const findUser = await this.prismaService.users.findFirst({
        where: { correo: change.email },
      });

      if (!findUser) {
        badResponse.message = `Correo no encontrado.`;
        return badResponse;
      }

      const hashedPassword = await bcrypt.hash(change.password, 12);

      await this.prismaService.users.update({
        data: {
          password: hashedPassword,
        },
        where: {
          id: findUser.id,
        },
      });

      baseResponse.message = `Contraseña recuperada.`;
      return baseResponse;
    } catch (error) {
      badResponse.message = `Ha ocurrido un error ${error}`;
      return badResponse;
    }
  }
}
