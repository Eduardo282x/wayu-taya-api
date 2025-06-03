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
    // grab all
    const donations = await this.prismaService.donation.findMany({
      orderBy: { id: 'asc' },
      include: {
        detDonation: {
          include: { medicine: true }
        }
      }
    });
  
    // id from all 4 inven
    const donationIds = donations.map(donation => donation.id);
  
    // grab from inv where id is from above
    const inventories = await this.prismaService.inventory.findMany({
      where: {
        donationId: { in: donationIds }
      }
    });
  
    // what got from inv >tie to> donations thingamajig
    const donationsWithDates = donations.map(donation => {
      const detDonationsWithDates = donation.detDonation.map(det => {
        const inventoryRecord = inventories.find(inv =>
          inv.donationId === donation.id && inv.medicineId === det.medicineId);
  
        return {
          ...det,
          admissionDate: inventoryRecord?.admissionDate,
          expirationDate: inventoryRecord?.expirationDate,
        };
      });
  
      return {
        ...donation,
        detDonation: detDonationsWithDates,
      };
    });
  
    return donationsWithDates;
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

      const dataInventory: InventoryDto = {
        // borre el type: "Entrada" porque me daba error despues de borrarlo del dto y ya lo puse para que se manejara automaticamente 
        // """"""""""""""""Crear los medicamentos en inventario"""""""""""""""" Supuestamente 
        donationId: donationCreated.id,
        type: donationCreated.type,
        date: donationCreated.date,
        medicines: dataDetDonation4Inv
      }

      await this.inventoryService.createInventory(dataInventory)

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