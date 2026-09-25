import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from 'src/common/decorators/public.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Sonda de salud sin dependencias extra (no requiere @nestjs/terminus).
 * `db` ejecuta un SELECT 1 real contra PostgreSQL.
 */
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @SkipThrottle()
  async check() {
    const db = await this.select('ok', async () => {
      await this.prisma.$queryRaw`SELECT 1`;
    });

    const healthy = db === 'ok';
    if (!healthy) {
      throw new ServiceUnavailableException({
        status: 'error',
        checks: { db },
      });
    }

    return {
      status: 'ok',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      checks: { db },
    };
  }

  private async select<T>(
    okValue: T,
    probe: () => Promise<void>,
  ): Promise<T | 'error'> {
    try {
      await probe();
      return okValue;
    } catch {
      return 'error' as const;
    }
  }
}
