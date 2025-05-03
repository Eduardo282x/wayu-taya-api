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

            const eventoCreated = await this.prismaService.eventos.create({
                data: {
                    nombre: evento.nombre,
                    descripcion: evento.descripcion,
                    direccion: evento.direccion,
                    id_parroquia: evento.id_parroquia,
                    fecha: evento.fecha,
                }
            })

            const dataProveedoresEventos = evento.id_proveedores.map((pro) => {
                return {
                    id_evento: eventoCreated.id_eventos,
                    id_proveedor: pro
                }
            })

            await this.prismaService.proveedoresEventos.createMany({
                data: dataProveedoresEventos
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

            const dataProveedoresEventos = evento.id_proveedores.map((pro) => {
                return {
                    id_evento: id_eventos,
                    id_proveedor: pro
                }
            })

            await this.prismaService.proveedoresEventos.updateMany({
                data: dataProveedoresEventos
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
            
            await this.prismaService.eventos.update({
                where: { id_eventos },
                data: { eliminada: true },
            });
    
            // Opcional: También puedes marcar como eliminados los registros relacionados
             await this.prismaService.proveedoresEventos.updateMany({
                 where: { id_evento: id_eventos },
                 data: { eliminada: true },
             });
    
            baseResponse.message = 'Evento marcado como eliminado exitosamente.';
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al marcar el evento como eliminado.' + error;
            return badResponse;
        }
    }



}
