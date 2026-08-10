import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProviderDTO } from './providers.dto';

@Injectable()
export class ProvidersService {
  constructor(private prismaService: PrismaService) {}

  async getProvidersAll() {
    return await this.prismaService.providers.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async getProviders() {
    return await this.prismaService.providers.findMany({
      orderBy: { id: 'asc' },
      where: { deleted: false },
    });
  }

  async createProviders(providers: ProviderDTO) {
    try {
      await this.prismaService.providers.create({
        data: {
          name: providers.name,
          rif: providers.rif,
          address: providers.address,
          country: providers.country,
          email: providers.email,
          phone: providers.phone,
          responsible: providers.responsible,
        },
      });
      return { message: 'Proveedor creado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updateProviders(providerId: number, providers: ProviderDTO) {
    try {
      await this.prismaService.providers.update({
        data: {
          name: providers.name,
          rif: providers.rif,
          address: providers.address,
          country: providers.country,
          email: providers.email,
          phone: providers.phone,
          responsible: providers.responsible,
        },
        where: { id: providerId },
      });
      return { message: 'Proveedor actualizado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async deleteProviders(providerId: number) {
    try {
      await this.prismaService.providers.update({
        where: { id: providerId },
        data: { deleted: true },
      });
      return { message: 'Proveedor marcado como eliminado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }
}
