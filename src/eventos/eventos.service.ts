import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventosDTO } from './eventos.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class EventosService {

    constructor(private prismaService: PrismaService) {

    }

    async getEventos() {
        return await this.prismaService.eventos.findMany({
            include: { parroquias: true }
        });
    }

    async createEvento(evento: EventosDTO) {
        try {
            await this.prismaService.eventos.create({
                data: {
                    nombre: evento.nombre,
                    descripcion: evento.descripcion,
                    direccion: evento.direccion,
                    id_parroquia: evento.id_parroquia,
                    fecha: evento.fecha,
                }
            })
            baseResponse.message = 'Eventos creado exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al crear evento.' + error
            return badResponse;
        }
    }

    async updateEvento(id_eventos: number, evento: EventosDTO) {
        try {
            await this.prismaService.eventos.update({
                data: { 
                    nombre: evento.nombre,
                    descripcion: evento.descripcion,
                    direccion: evento.direccion,
                    id_parroquia: evento.id_parroquia,
                    fecha: evento.fecha,
                 },
                where: { id_eventos }
            })
            baseResponse.message = 'Evento actualizado exitosamente.'
            return baseResponse;
        }
        catch (error) {
            badResponse.message = 'Error al actualizar el Evento. ' + error
            return badResponse;
        }
    }

    async deleteEvento(id_eventos: number) {
        try {
            await this.prismaService.eventos.delete({
                where: { id_eventos }
            })
            baseResponse.message = 'Evento eliminado exitosamente.'
            return baseResponse;
        } catch (err) {
            badResponse.message = 'Error al eliminar el Evento.' + err
            return badResponse;
        }
    }



}
