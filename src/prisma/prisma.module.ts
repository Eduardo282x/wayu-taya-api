import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global y SINGLETON a propósito.
 *
 * Antes `PrismaService` estaba declarado en AppModule y en 15 módulos más.
 * Nest creaba una instancia distinta por módulo, y cada una abría su propio
 * `pg.Pool`: 15 pools x 10 conexiones = 150 conexiones, por encima del
 * `max_connections` por defecto de PostgreSQL (100) -> agotamiento de pool.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
