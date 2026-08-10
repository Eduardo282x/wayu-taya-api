import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProveedoresDTO } from './proveedores.dto';

@Injectable()
export class ProveedoresService {
  constructor(private prismaService: PrismaService) {}

  async getProveedoresAll() {
    return await this.prismaService.providers.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async getProveedores() {
    return await this.prismaService.providers.findMany({
      orderBy: { id: 'asc' },
      where: { deleted: false },
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
          email: proveedores.email,
          phone: proveedores.phone,
          responsible: proveedores.responsible,
        },
      });
      return { message: 'Proveedor creado exitosamente.' };
    } catch (error) {
      throw error;
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
          email: proveedores.email,
          phone: proveedores.phone,
          responsible: proveedores.responsible,
        },
        where: { id: id_proveedor },
      });
      return { message: 'Proveedor actualizado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async deleteProveedores(id_proveedor: number) {
    try {
      await this.prismaService.providers.update({
        where: { id: id_proveedor },
        data: { deleted: true },
      });
      return { message: 'Proveedor marcado como eliminado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }
}
