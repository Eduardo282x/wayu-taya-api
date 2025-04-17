import { Module } from '@nestjs/common';
import { EstadosController } from './estados.controller';
import { EstadosService } from './estados.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
    controllers: [EstadosController],
    providers: [EstadosService, PrismaService]
})
export class EstadosModule { }
