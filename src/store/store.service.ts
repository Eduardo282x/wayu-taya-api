import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StoreDTO } from './store.dto';

@Injectable()
export class StoreService {
  constructor(private prismaService: PrismaService) { }
  async getStore() {
    const stores = await this.prismaService.store.findMany({
      orderBy: { id: 'asc' },
      where: {
        deleted: false
      }
    });

    return {
      stores
    }
  }

  async createStore(store: StoreDTO) {
    try {
      const newStore = await this.prismaService.store.create({
        data: {
          name: store.name,
          address: store.address,
        },
      });
      return { store: newStore, message: 'Almacén creado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updateStore(id: number, store: StoreDTO) {
    try {
      const storeUpdate = await this.prismaService.store.update({
        data: {
          name: store.name,
          address: store.address,
        },
        where: { id: id },
      });
      return { store: storeUpdate, message: 'Almacén actualizado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async deleteStore(id: number) {
    try {
      const deleteStore = await this.prismaService.store.update({
        where: { id: id },
        data: { deleted: true },
      });

      return { store: deleteStore, message: 'Almacén eliminado exitosamente' };
    } catch (error) {
      throw error;
    }
  }
}
