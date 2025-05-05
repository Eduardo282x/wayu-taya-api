import { Module } from '@nestjs/common';
import { ProveedoresController } from './proveedores.controller';
import { ProveedoresService } from './proveedores.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ProveedoresController],
  providers: [ProveedoresService,PrismaService]
})
export class ProveedoresModule {}
