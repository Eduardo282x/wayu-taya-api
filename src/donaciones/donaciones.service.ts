import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DonacionesDTO } from './donaciones.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class DonacionesService {

    constructor(private prismaService: PrismaService){}

    async getDonations() {
        return await this.prismaService.donation.findMany({
            orderBy: {id: 'asc'},
            include: {detDonation:{include:{medicine: true}}, inventory: true}
        })
    }

    async createDonation(donation: DonacionesDTO) {
        try {
          // 1. Crear la donación principal
          const donationCreated = await this.prismaService.donation.create({
            data: {
              peopleId: donation.peopleId,
              providerId: donation.providerId,
              type: donation.type,
              date: donation.date,
              lote: donation.lote,
              //createAt: new Date(),
              
            },
          });
          console.log('medicines:', donation.medicines);
          // 2. Preparar los detalles de las medicinas
          const dataDetDonation = donation.medicines.map((pro) => {
            return {
              donationId: donationCreated.id,
              medicineId: pro.medicineId,
              amount: pro.amount,
            };
          });
    
          // 3. Crear todos los detalles en lote
          await this.prismaService.detDonation.createMany({
            data: dataDetDonation
            });

        baseResponse.message = 'Donación creada exitosamente.'
        return baseResponse;
        } catch (error) {

      badResponse.message = 'Error al crear la donación: ' + error
      return badResponse;}
    }
}
