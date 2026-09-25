import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from './auth.types';
import {
  DTOChangePassword,
  DTOConfirmReset,
  DTOLogin,
  DTORecoverPassword,
  DTORefreshToken,
} from './auth.dto';

/**
 * Los nombres `default` y `short` son los definidos en AppModule
 * (ThrottlerModule.forRoot). El decorador SUSTITUYE sus valores en la ruta.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Anti-fuerza bruta: 5 intentos / 15 min por IP. */
  @Public()
  @Throttle({
    default: { limit: 5, ttl: 900_000 },
    short: { limit: 3, ttl: 30_000 },
  })
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async login(@Body() dto: DTOLogin, @Ip() ip: string) {
    return this.authService.authLogin(dto, ip);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 900_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('/refresh')
  async refresh(@Body() dto: DTORefreshToken) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('/logout')
  async logout(@Body() dto: DTORefreshToken) {
    return this.authService.logout(dto.refreshToken);
  }

  /** Paso 1: solicita el enlace. NO cambia la contraseña. */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('/recover')
  async requestReset(@Body() dto: DTORecoverPassword) {
    return this.authService.requestPasswordReset(dto.email);
  }

  /** Paso 2: confirma con el token recibido. SÍ cambia la contraseña. */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('/recover/confirm')
  async confirmReset(@Body() dto: DTOConfirmReset) {
    return this.authService.confirmPasswordReset(dto.token, dto.password);
  }

  /**
   * Cambio de contraseña por el propio usuario autenticado.
   * NO es público: exige access token válido y la contraseña actual.
   * Tras el cambio se revocan todas las sesiones, por lo que el frontend
   * debe pedir un refresh inmediatamente.
   */
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('/change-password')
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: DTOChangePassword,
  ) {
    return this.authService.changeOwnPassword(
      user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
