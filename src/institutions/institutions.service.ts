import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InstitutionsDTO } from './institutions.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class InstitutionsService {

    constructor(private prismaService: PrismaService) {

    }

    async getInstitutionsAll() {
        return await this.prismaService.institutions.findMany({
            orderBy: { id: 'asc' }
        });
    }

    async getInstitutions() {
        return await this.prismaService.institutions.findMany({
            orderBy: { id: 'asc' },
            where: { deleted: false }
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
                }
            })
            baseResponse.message = 'Institucion creada exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al crear la Institucion.' + error
            return badResponse;
        }
    }

    async updateInstitutions(id_institution: number, institutions: InstitutionsDTO) {
        try {
            await this.prismaService.institutions.update({
                data: {
                    name: institutions.name,
                    rif: institutions.rif,
                    address: institutions.address,
                    country: institutions.country,
                    email: institutions.email,
                },
                where: { id: id_institution }
            })
            baseResponse.message = 'Institucion actualizada exitosamente.'
            return baseResponse;
        }
        catch (error) {
            badResponse.message = 'Error al actualizar la Institucion. ' + error
            return badResponse;
        }
    }

    async deleteInstitutions(id_institution: number) {
        try {
            await this.prismaService.institutions.update({
                where: { id: id_institution },
                data: { deleted: true },
            });
            baseResponse.message = 'Institucion marcada como deleted exitosamente.';
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al marcar el institucion como deleted.' + error;
            return badResponse;
        }
    }
}
