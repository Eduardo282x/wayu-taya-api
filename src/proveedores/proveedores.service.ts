import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProveedoresDTO } from './proveedores.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class ProveedoresService {

    constructor(private prismaService: PrismaService) {

    }

    async getProveedoresAll() {
        return await this.prismaService.providers.findMany({
            orderBy: { id: 'asc' }
        });
    }

    async getProveedores() {
        return await this.prismaService.providers.findMany({
            orderBy: { id: 'asc' },
            where: { deleted: false }
        });
    }

    async createProveedores(proveedores: ProveedoresDTO) {
        try {
            await this.prismaService.providers.create({
                data: {
                    name: proveedores.name,
                    rif: proveedores.rif,
                    address: proveedores.address,
                    country: proveedores.country,
                    email: proveedores.correo,
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
            await this.prismaService.providers.update({
                data: {
                    name: proveedores.name,
                    rif: proveedores.rif,
                    address: proveedores.address,
                    country: proveedores.country,
                    email: proveedores.correo,
                },
                where: { id: id_proveedor }
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
            await this.prismaService.providers.update({
                where: { id: id_proveedor },
                data: { deleted: true },
            });
            baseResponse.message = 'Proveedor marcado como eliminado exitosamente.';
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al marcar el proveedor como eliminado.' + error;
            return badResponse;
        }
    }

}
