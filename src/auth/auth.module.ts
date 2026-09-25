import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { LoginAttemptService } from './login-attempt.service';
import {
  DEFAULT_EXPIRES_IN,
  DEFAULT_REFRESH_EXPIRES_IN,
  signOptions,
  refreshTtlMs,
} from './jwt.config';

/**
 * Global para que `JwtService` quede disponible en toda la app con su secreto
 * configurado. Antes se declaraba un `JwtService` "pelado" en AppModule, y los
 * guards recibían esa instancia sin secreto: `verifyAsync` no habría validado nada.
 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: signOptions(configService),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LoginAttemptService, AuthGuard, RolesGuard],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}

export { DEFAULT_EXPIRES_IN, DEFAULT_REFRESH_EXPIRES_IN, refreshTtlMs };
