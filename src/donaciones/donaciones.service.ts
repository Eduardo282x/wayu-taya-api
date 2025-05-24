import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DonationsDTO } from './donaciones.dto';
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

    async createDonation(donation: DonationsDTO) {
        try {
          // Crear la donación principal
          const donationCreated = await this.prismaService.donation.create({
            data: {
              peopleId: donation.peopleId,
              providerId: donation.providerId,
              type: donation.type,
              date: donation.date,
              lote: donation.lote,
            },
          });
          // Preparar los detalles de las medicinas
          const dataDetDonation = donation.medicines.map((pro) => {
            return {
              donationId: donationCreated.id,
              medicineId: pro.medicineId,
              amount: pro.amount,
            };
          });
    
          // Crear todos los detalles en lote
          await this.prismaService.detDonation.createMany({
            data: dataDetDonation
            });

        baseResponse.message = 'Donación creada exitosamente.'
        return baseResponse;
        } catch (error) {

      badResponse.message = 'Error al crear la donación: ' + error
      return badResponse;}
    }


    async updateDonation(id: number, donation: DonationsDTO){
      try {
        const donationCreated = await this.prismaService.donation.update({
          data: {
            peopleId: donation.peopleId,
            providerId: donation.providerId,
            type: donation.type,
            date: donation.date,
            lote: donation.lote,
          },
          where: { id }
        });
        // Necesitas añadir >> changeDonDetails:true << en el JSON para cambiar los detalles de la donacion

        if (donation.changeDonDetails) {// < Borras lo existente
          await this.prismaService.detDonation.deleteMany({
          where: { donationId: id }});

          const dataDetDonation = donation.medicines.map((pro) => ({
              donationId: donationCreated.id,
              medicineId: pro.medicineId,
              amount: pro.amount,
          }));       
          await this.prismaService.detDonation.createMany({ // < Creas el reemplazo
            data: dataDetDonation
            });
        }
        baseResponse.message = 'Event actualizado exitosamente.'
        return baseResponse;
      } catch (error) {
      badResponse.message = 'Error al actualizar el Event. ' + error
      return badResponse;
      }

    }
}

// 🤡