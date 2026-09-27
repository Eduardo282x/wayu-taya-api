import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  GetInstitutionsQueryDTO,
  InstitutionsDTO,
  InstitutionsManyDTO,
} from './institutions.dto';

import { toLocationInput } from 'src/common/dto/location.dto';

@Injectable()
export class InstitutionsService {
  constructor(private prismaService: PrismaService) {}

  async getInstitutionsAll() {
    const institutions = await this.prismaService.institutions.findMany({
      orderBy: { id: 'asc' },
    });

    return { institutions };
  }

  async getInstitutions(query?: GetInstitutionsQueryDTO) {
    const page = query?.page ?? 1;
    const size = query?.size ?? 100;

    const where = { deleted: false };

    const [institutions, total] = await Promise.all([
      this.prismaService.institutions.findMany({
        orderBy: { id: 'asc' },
        where,
        skip: (page - 1) * size,
        take: size,
      }),
      this.prismaService.institutions.count({ where }),
    ]);

    return {
      institutions,
      pagination: {
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  async createInstitutions(institutions: InstitutionsDTO) {
    try {
      const institutionCreated = await this.prismaService.institutions.create({
        data: {
          name: institutions.name,
          rif: institutions.rif,
          address: institutions.address,
          responsible: institutions.responsible,
          phone: institutions.phone,
          country: institutions.country,
          email: institutions.email,
          type: institutions.type,
          location: toLocationInput(institutions.location),
        },
      });
      return {
        institution: institutionCreated,
        message: 'Institución creada exitosamente.',
      };
    } catch (error) {
      throw error;
    }
  }

  async createManyInstitutions(institutions: InstitutionsManyDTO) {
    try {
      await this.prismaService.institutions.createMany({
        data: institutions.institutions.map((institution) => ({
          name: institution.name,
          rif: institution.rif,
          address: institution.address,
          responsible: institution.responsible,
          phone: institution.phone,
          country: institution.country,
          email: institution.email,
          type: institution.type,
          location: toLocationInput(institution.location),
        })),
      });
      return { message: 'Instituciones creadas exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updateInstitutions(id: number, institutions: InstitutionsDTO) {
    try {
      const institutionUpdated = await this.prismaService.institutions.update({
        data: {
          name: institutions.name,
          rif: institutions.rif,
          address: institutions.address,
          country: institutions.country,
          responsible: institutions.responsible,
          phone: institutions.phone,
          email: institutions.email,
          type: institutions.type,
          location: toLocationInput(institutions.location),
        },
        where: { id },
      });
      return {
        institution: institutionUpdated,
        message: 'Institución actualizada exitosamente.',
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteInstitutions(id_institution: number) {
    try {
      const institutionDeleted = await this.prismaService.institutions.update({
        where: { id: id_institution },
        data: { deleted: true },
      });
      return {
        institution: institutionDeleted,
        message: 'Institución marcada como eliminada exitosamente.',
      };
    } catch (error) {
      throw error;
    }
  }
}
