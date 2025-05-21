import { Module } from '@nestjs/common';
import { EstadosController } from './state.controller';
import { StateService } from './state.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
    controllers: [EstadosController],
    providers: [StateService, PrismaService]
})
export class EstadosModule { }
