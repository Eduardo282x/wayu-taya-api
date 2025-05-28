import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StoreDTO } from './store.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class StoreService {

    constructor(private prismaService: PrismaService) {

    }
    async getStore() {
        return await this.prismaService.store.findMany();
    }

<<<<<<< HEAD:src/almacen/almacen.service.ts
    async createStore(store: AlmacenDTO) {
        try {
=======
    async createStore(store: StoreDTO){
        try{
>>>>>>> 4ea71d267badf7dcbe6af4b5b0b705423a9604cf:src/store/store.service.ts
            await this.prismaService.store.create({
                data: {
                    name: store.name,
                    address: store.address
                }
            });
            baseResponse.message = 'Almacén creado exitosamente.'
            return baseResponse;
<<<<<<< HEAD:src/almacen/almacen.service.ts
        } catch (err) {
            badResponse.message = `Error al crear el Almacén. ${err}`
=======
        } catch(error){
            badResponse.message = 'Error al crear el Almacen.' + error
>>>>>>> 4ea71d267badf7dcbe6af4b5b0b705423a9604cf:src/store/store.service.ts
            return badResponse;
        }
    }

<<<<<<< HEAD:src/almacen/almacen.service.ts
    async updateStore(id: number, store: AlmacenDTO) {
=======
    async updateStore(id: number, store: StoreDTO){
>>>>>>> 4ea71d267badf7dcbe6af4b5b0b705423a9604cf:src/store/store.service.ts
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
<<<<<<< HEAD:src/almacen/almacen.service.ts
        } catch (err) {
            badResponse.message = 'Error al actualizar el Almacen.' + { err }
=======
        } catch (error) {
            badResponse.message = 'erroror al actualizar el Almacen.' + error
>>>>>>> 4ea71d267badf7dcbe6af4b5b0b705423a9604cf:src/store/store.service.ts
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
<<<<<<< HEAD:src/almacen/almacen.service.ts
        } catch (err) {
            badResponse.message = 'Error al eliminar el Almacen.' + { err }
=======
        } catch (error) {
            badResponse.message = 'Error al eliminar el Almacen.' + error
>>>>>>> 4ea71d267badf7dcbe6af4b5b0b705423a9604cf:src/store/store.service.ts
            return badResponse;
        }

    }

}
