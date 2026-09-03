import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StoreDTO } from './store.dto';

@Injectable()
export class StoreService {
  constructor(private prismaService: PrismaService) { }
  private buildCapacityInfo(capacity: number, usedCapacity: number) {
    const availableCapacity = Math.max(capacity - usedCapacity, 0);
    const capacityPercentage = capacity > 0
      ? Math.round((usedCapacity / capacity) * 10000) / 100
      : 0;
    return { capacity, usedCapacity, availableCapacity, capacityPercentage };
  }

  async getStore() {
    const stores = await this.prismaService.store.findMany({
      orderBy: { id: 'asc' },
      where: {
        deleted: false
      },
      include: {
        inventory: {
          select: { stock: true },
        },
      },
    });

    const storesWithCapacity = stores.map((store) => {
      const usedCapacity = store.inventory.reduce(
        (sum, item) => sum + item.stock,
        0,
      );
      return {
        id: store.id,
        name: store.name,
        address: store.address,
        deleted: store.deleted,
        ...this.buildCapacityInfo(store.capacity, usedCapacity),
      };
    });

    return {
      stores: storesWithCapacity
    }
  }

  async createStore(store: StoreDTO) {
    try {
      const newStore = await this.prismaService.store.create({
        data: {
          name: store.name,
          address: store.address,
          capacity: store.capacity ?? 0,
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
          capacity: store.capacity,
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
