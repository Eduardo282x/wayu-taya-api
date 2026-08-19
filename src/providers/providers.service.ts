import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetProvidersQueryDTO, ProviderDTO } from './providers.dto';

@Injectable()
export class ProvidersService {
  constructor(private prismaService: PrismaService) {}

  async getProvidersAll() {
    const providers = await this.prismaService.providers.findMany({
      orderBy: { id: 'asc' },
    });

    return { providers };
  }

  async getProviders(query?: GetProvidersQueryDTO) {
    const page = query?.page ?? 1;
    const size = query?.size ?? 100;

    const where = { deleted: false };

    const [providers, total] = await Promise.all([
      this.prismaService.providers.findMany({
        orderBy: { id: 'asc' },
        where,
        skip: (page - 1) * size,
        take: size,
      }),
      this.prismaService.providers.count({ where }),
    ]);

    return {
      providers,
      pagination: {
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  async createProviders(providers: ProviderDTO) {
    try {
      const providerCreated = await this.prismaService.providers.create({
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
      return { provider: providerCreated, message: 'Proveedor creado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updateProviders(providerId: number, providers: ProviderDTO) {
    try {
      const providerUpdated = await this.prismaService.providers.update({
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
      return { provider: providerUpdated, message: 'Proveedor actualizado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async deleteProviders(providerId: number) {
    try {
      const providerDeleted = await this.prismaService.providers.update({
        where: { id: providerId },
        data: { deleted: true },
      });
      return { provider: providerDeleted, message: 'Proveedor marcado como eliminado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }
}
