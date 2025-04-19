import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { EstadosModule } from './estados/estados.module';
import { ParroquiasModule } from './parroquias/parroquias.module';

@Module({
  imports: [EstadosModule, ParroquiasModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
