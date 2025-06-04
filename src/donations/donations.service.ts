import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DonationsDTO } from './donations.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';
import { InventoryService } from 'src/inventory/inventory.service';
import { InventoryDto, MedicinesDto } from 'src/inventory/inventory.dto';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';

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

  async generateDonationPDF(donationId: number, filePath: string) {
    // 1. Obtener datos de la donación y detalles
  const donation = await this.prismaService.donation.findUnique({
    where: { id: donationId },
    include: {
      detDonation: { include: { medicine: true } }
    }
  });

  const people = donation.peopleId
    ? await this.prismaService.people.findUnique({ where: { id: donation.peopleId } })
    : null;

  const provider = donation.providerId
    ? await this.prismaService.providers.findUnique({ where: { id: donation.providerId } })
    : null;

  const inventories = await this.prismaService.inventory.findMany({
    where: { donationId }
  });

  // 2. Crear el documento PDF
  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  doc.pipe(fs.createWriteStream(filePath));

  // 3. Encabezado y datos principales
  doc.fontSize(10).text('FACTURA NO COMERCIAL', 50, 30, { align: 'center' });
  doc.fontSize(8).text('ASISTENCIA DE SALUD\nNO PARA RE-VENTA O FINES COMERCIALES', 50, 45, { align: 'center' });
  doc.moveDown();

  doc.fontSize(9);
  doc.text(`NUMERO DE DONACION: D-${donation.id}`, 30, 80);
  doc.text(`FECHA: ${donation.date.toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 350, 80);
  doc.text(`CONSIGNATARIO: ${provider?.name || '---'}`, 30, 100);
  doc.text(`NOMBRE: ${people?.name || ''} ${people?.lastName || ''}`, 30, 115);
  doc.text(`RIF.: ${provider?.rif || 'SIN INF.'}`, 350, 115);
  doc.text(`DIRECCIÓN: ${people?.address || ''}`, 30, 130);
  doc.text(`TELÉFONO: ${people?.phone || ''}`, 350, 130);
  doc.text(`ATENCIÓN: ${people?.name || ''} ${people?.lastName || ''}`, 30, 145);
  doc.text(`CORREO-E: ${people?.email || ''}`, 350, 145);

  doc.moveDown(2);

  // 4. Título de la tabla
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1997B1').text('LISTA DE MEDICAMENTOS', { align: 'left' });
  doc.moveDown(0.5);

  // 5. Dibujar tabla manualmente
  const startX = 30;
  let startY = doc.y;
  const rowHeight = 20;

  // Columnas y sus anchos
  const columns = [
    { header: 'N°', width: 30 },
    { header: 'ID', width: 40 },
    { header: 'PRODUCTO', width: 150 },
    { header: 'CANT', width: 40 },
    { header: 'UND', width: 40 },
    { header: 'NDC', width: 40 },
    { header: 'LOTE', width: 60 },
    { header: 'ORIGEN', width: 50 },
    { header: 'F. VENCE', width: 70 },
    { header: 'VALOR', width: 50 },
  ];

  // Dibujar encabezados
  let x = startX;
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#1997B1');
  for (const col of columns) {
    doc.text(col.header, x, startY, { width: col.width, align: 'center' });
    x += col.width;
  }

  // Línea bajo encabezados
  startY += rowHeight - 5;
  doc.moveTo(startX, startY).lineTo(x, startY).stroke();

  // Dibujar filas
  doc.font('Helvetica').fontSize(8).fillColor('black');
  startY += 5;

  donation.detDonation.forEach((det, idx) => {
    const inventory = inventories.find(inv => inv.medicineId === det.medicineId);
    x = startX;

    const row = [
      (idx + 1).toString(),
      det.medicine.id.toString(),
      det.medicine.name,
      det.amount.toString(),
      det.medicine.unit,
      'NDC',
      donation.lote || '',
      'S/N',
      inventory?.expirationDate ? inventory.expirationDate.toISOString().slice(0, 10) : '',
      '',
    ];

    for (let i = 0; i < columns.length; i++) {
      doc.text(row[i], x, startY, { width: columns[i].width, align: 'center' });
      x += columns[i].width;
    }

    startY += rowHeight;

    // Opcional: línea divisoria entre filas
    doc.moveTo(startX, startY - 5).lineTo(x, startY - 5).stroke();
  });

  doc.end();
  }
}