import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StoreDTO } from './store.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class StoreService {

    constructor(private prismaService: PrismaService){

    }
    async getStore(){
        return await this.prismaService.store.findMany({include: {inventory: true, historyInventory: true }});
    }

    async createStore(store: StoreDTO){
        try{
            await this.prismaService.store.create({
                data:{
                    name: store.name,
                    address: store.address
                }
            });
            baseResponse.message = 'Almacen creado exitosamente.'
            return baseResponse;
        } catch(error){
            badResponse.message = 'Error al crear el Almacen.' + error
            return badResponse;
        }
    }

    async updateStore(id: number, store: StoreDTO){
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
        } catch (error) {
            badResponse.message = 'erroror al actualizar el Almacen.' + error
            return badResponse;
        }
    }
  
    async deleteStore(id: number){
        try {
            await this.prismaService.store.delete({
                where: {id:id}
            })

            baseResponse.message = 'almacen eliminado exitosamente';
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al eliminar el Almacen.' + error
            return badResponse;
        }

    }

}
