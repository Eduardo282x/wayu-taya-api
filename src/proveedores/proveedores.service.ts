import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProveedoresDTO } from './proveedores.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class ProveedoresService {

    constructor(private prismaService: PrismaService){

    }

    async getProveedores() {
        return await this.prismaService.proveedores.findMany({
            include: { ProveedoresEventos: true}
        });
    }

    async createProveedores(proveedores: ProveedoresDTO) {
        try {
            await this.prismaService.proveedores.create({
                data: {
                    nombre: proveedores.nombre,
                    rif: proveedores.rif,
                    direccion: proveedores.direccion,
                    pais: proveedores.pais,
                    correo: proveedores.correo,
                }
            })
            baseResponse.message = 'Proveedor creado exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al crear el Proveedor.' + error
            return badResponse;
        }
    }

    async updateProveedores(id_proveedor: number, proveedores: ProveedoresDTO) {
        try {
            await this.prismaService.proveedores.update({
                data: { 
                    nombre: proveedores.nombre,
                    rif: proveedores.rif,
                    direccion: proveedores.direccion,
                    pais: proveedores.pais,
                    correo: proveedores.correo,
                 },
                where: { id_proveedor }
            })
            baseResponse.message = 'Proveedor actualizado exitosamente.'
            return baseResponse;
        }
        catch (error) {
            badResponse.message = 'Error al actualizar el Proveedor. ' + error
            return badResponse;
        }
    }

    async deleteProveedores(id_proveedor: number) {
        try {
            
            await this.prismaService.proveedores.update({
                where: { id_proveedor },
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
