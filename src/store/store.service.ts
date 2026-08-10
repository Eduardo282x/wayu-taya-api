import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StoreDTO } from './store.dto';

@Injectable()
export class StoreService {
  constructor(private prismaService: PrismaService) {}
  async getStore() {
    return await this.prismaService.store.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async createStore(store: StoreDTO) {
    try {
      await this.prismaService.store.create({
        data: {
          name: store.name,
          address: store.address,
        },
      });
      return { message: 'Almacén creado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updateStore(id: number, store: StoreDTO) {
    try {
      await this.prismaService.store.update({
        data: {
          name: store.name,
          address: store.address,
        },
        where: { id: id },
      });
      return { message: 'Almacén actualizado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async deleteStore(id: number) {
    try {
      await this.prismaService.store.delete({
        where: { id: id },
      });

      return { message: 'Almacén eliminado exitosamente' };
    } catch (error) {
      throw error;
    }
  }
}
