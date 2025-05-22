import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AlmacenDTO } from './almacen.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class AlmacenService {

    constructor(private prismaService: PrismaService) {

    }
    async getStore() {
        return await this.prismaService.store.findMany();
    }

    async createStore(store: AlmacenDTO) {
        try {
            await this.prismaService.store.create({
                data: {
                    name: store.name,
                    address: store.address
                }
            });
            baseResponse.message = 'Almacén creado exitosamente.'
            return baseResponse;
        } catch (err) {
            badResponse.message = `Error al crear el Almacén. ${err}`
            return badResponse;
        }
    }

    async updateStore(id: number, store: AlmacenDTO) {
        try {
            await this.prismaService.store.update({
                data: {
                    name: store.name,
                    address: store.address
                },
                where: { id: id }
            });
            baseResponse.message = 'exito al actualizar el Almacen.'
            return baseResponse;
        } catch (err) {
            badResponse.message = 'Error al actualizar el Almacen.' + { err }
            return badResponse;
        }
    }

    async deleteStore(id: number) {
        try {
            await this.prismaService.store.delete({
                where: { id: id }
            })

            baseResponse.message = 'almacen eliminado exitosamente';
            return baseResponse;
        } catch (err) {
            badResponse.message = 'Error al eliminar el Almacen.' + { err }
            return badResponse;
        }

    }

}
