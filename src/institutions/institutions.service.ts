import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InstitutionsDTO, InstitutionsManyDTO } from './institutions.dto';

@Injectable()
export class InstitutionsService {
  constructor(private prismaService: PrismaService) {}

  async getInstitutionsAll() {
    return await this.prismaService.institutions.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async getInstitutions() {
    return await this.prismaService.institutions.findMany({
      orderBy: { id: 'asc' },
      where: { deleted: false },
      include: {
        parish: {
          select: { name: true },
        },
      },
    });
  }

  async createInstitutions(institutions: InstitutionsDTO) {
    try {
      await this.prismaService.institutions.create({
        data: {
          name: institutions.name,
          rif: institutions.rif,
          address: institutions.address,
          country: institutions.country,
          email: institutions.email,
          type: institutions.type,
          parishId: institutions.parishId,
        },
      });
      return { message: 'Institución creada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async createManyInstitutions(institutions: InstitutionsManyDTO) {
    try {
      await this.prismaService.institutions.createMany({
        data: institutions.institutions,
      });
      return { message: 'Instituciones creadas exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updateInstitutions(id: number, institutions: InstitutionsDTO) {
    try {
      await this.prismaService.institutions.update({
        data: {
          name: institutions.name,
          rif: institutions.rif,
          address: institutions.address,
          country: institutions.country,
          email: institutions.email,
          type: institutions.type,
          parishId: institutions.parishId,
        },
        where: { id },
      });
      return { message: 'Institución actualizada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async deleteInstitutions(id_institution: number) {
    try {
      await this.prismaService.institutions.update({
        where: { id: id_institution },
        data: { deleted: true },
      });
      return { message: 'Institucion marcada como eliminada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }
}
