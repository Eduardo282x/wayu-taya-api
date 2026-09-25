import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolConfig } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    const poolLogger = new Logger('PrismaPool');

    const poolConfig: PoolConfig = {
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
      max: Number(config.get('DB_POOL_MAX') ?? 20),
      min: Number(config.get('DB_POOL_MIN') ?? 2),
      idleTimeoutMillis: 30_000,
      // Antes venía de pg como 0 = espera INFINITA. Una consulta lenta
      // bloqueaba un slot del pool para siempre y saturaba la app.
      connectionTimeoutMillis: 5_000,
      // Recicla conexiones para no arrastrar estados degradados de PG
      maxUses: 10_000,
    };

    const pool = new Pool(poolConfig);

    // Sin este listener, un cliente idle que muere (reinicio de Postgres,
    // idle_session_timeout) emite 'error' y Node CRASHEA el proceso.
    pool.on('error', (err) => {
      poolLogger.error(`Error en cliente idle del pool: ${err.message}`);
    });

    super({
      adapter: new PrismaPg(pool),
      transactionOptions: { timeout: 10_000, maxWait: 5_000 },
      log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });

    this.pool = pool;
  }

  /** Conexión eagerly: valida credenciales en el arranque, no en la 1ª petición. */
  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma conectado a PostgreSQL');
  }

  /** Cierre limpio. Evita connection leaks (requiere app.enableShutdownHooks()). */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Pool de PostgreSQL cerrado correctamente');
  }
}
