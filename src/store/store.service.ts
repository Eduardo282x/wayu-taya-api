import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StoreDTO } from './store.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class StoreService {

    constructor(private prismaService: PrismaService) {

    }
    async getStore() {
        return await this.prismaService.store.findMany({
            orderBy: { id: 'asc' }
        });
    }

    async createStore(store: StoreDTO) {
        try {
            await this.prismaService.store.create({
                data: {
                    name: store.name,
                    address: store.address
                }
            });
            baseResponse.message = 'Almacén creado exitosamente.'
            return baseResponse;
        } catch(error){
            badResponse.message = 'Error al crear el Almacén.' + error
            return badResponse;
        }
    }

    async updateStore(id: number, store: StoreDTO) {
        try {
            await this.prismaService.store.update({
                data: {
                    name: store.name,
                    address: store.address
                },
                where: { id: id }
            });
            baseResponse.message = 'Almacén actualizado exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al actualizar el Almacén.' + error
            return badResponse;
        }
    }

    async deleteStore(id: number) {
        try {
            await this.prismaService.store.delete({
                where: { id: id }
            })

            baseResponse.message = 'Almacén eliminado exitosamente';
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al eliminar el Almacén: ' + error
            return badResponse;
        }

    }

}
