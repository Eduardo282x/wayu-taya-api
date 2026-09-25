import { Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MainLoadService } from './main-load.service';
import { Roles } from 'src/auth/roles.decorator';
import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Endpoint DESTRUCTIVO: siembra la base de datos y crea usuarios.
 *
 * Antes era `@Get()`, lo que lo hacía disparable desde cualquier web con un
 * simple `<img src=".../api/main-load">` (CSRF). Ahora es POST, exige rol de
 * Super Admin y está limitado a una ejecución por día.
 */
@Controller('main-load')
export class MainLoadController {
  constructor(private readonly mainLoadService: MainLoadService) {}

  @Roles('Super Admin')
  @Throttle({ default: { limit: 1, ttl: 86_400_000 } })
  @Post('/seed')
  async createData() {
    try {
      return await this.mainLoadService.seedLocations();
    } catch {
      // El detalle real lo registra el filtro global de excepciones; aqui solo
      // se evita filtrar el mensaje interno de Prisma al cliente.
      throw new HttpException(
        'No se pudo ejecutar la carga inicial de datos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
