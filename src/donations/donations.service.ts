import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DonationsDTO } from './donations.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';
import { InventoryService } from 'src/inventory/inventory.service';
import { InventoryDto, MedicinesDto } from 'src/inventory/inventory.dto';

@Injectable()
export class DonationsService {

  constructor(
    private prismaService: PrismaService,
    private inventoryService: InventoryService
  ) { }

  async getDonations() {
    return await this.prismaService.donation.findMany({
      orderBy: { id: 'asc' },
      include: { detDonation: { include: { medicine: true } } }
    })
  }

  async createDonation(donation: DonationsDTO) {
    try {
      // Crear la donación principal
      const donationCreated = await this.prismaService.donation.create({
        data: {
          peopleId: donation.peopleId,
          providerId: donation.providerId,
          type: donation.type, // Entrada o Salida
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

      const dataDetDonation4Inv: MedicinesDto[] = donation.medicines.map((pro) => {
        return {
          // Todo esto va dentro de medicine {}, pones una llave por cada medicina a ingresar
          medicineId: pro.medicineId,
          stock: pro.amount,
          storeId: pro.storageId,
          admissionDate: pro.admissionDate,
          expirationDate: pro.expirationDate
        };
      });

      // Crear todos los detalles en lote
      await this.prismaService.detDonation.createMany({
        data: dataDetDonation
      });

      // """"""""""""""""Crear los medicamentos en inventario"""""""""""""""" Supuestamente 
      const data4Inventory: InventoryDto = {
        donationId: donationCreated.id,
        type: donationCreated.type,
        date: donationCreated.date,
        medicines: dataDetDonation4Inv
      }

      await this.inventoryService.createInventory(data4Inventory)

      baseResponse.message = 'Donación creada exitosamente.'
      return baseResponse;
    } catch (error) {

      badResponse.message = 'Error al crear la donación: ' + error
      return badResponse;
    }
  }


  async updateDonation(id: number, donation: DonationsDTO) {
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
          where: { donationId: id }
        });

        const dataDetDonation = donation.medicines.map((pro) => ({
          donationId: donationCreated.id,
          medicineId: pro.medicineId,
          amount: pro.amount,
        }));
        await this.prismaService.detDonation.createMany({ // < Creas el reemplazo
          data: dataDetDonation
        });
      }
      baseResponse.message = 'Donacion actualizada exitosamente.'
      return baseResponse;
    } catch (error) {
      badResponse.message = 'Error al actualizar la Donacion. ' + error
      return badResponse;
    }

  }
}

// 🤡🤡