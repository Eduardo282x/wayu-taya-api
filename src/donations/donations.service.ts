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
          institutionId: donation.institutionId,
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
          institutionId: donation.institutionId,
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

    
      const donation = await this.prismaService.donation.findUnique({
        where: { id: donationId },
        include: {
          detDonation: { include: { medicine: true } }
        }
      });
    
      const institution = donation.institutionId
        ? await this.prismaService.institutions.findUnique({ where: { id: donation.institutionId } })
        : null;
    
      const provider = donation.providerId
        ? await this.prismaService.providers.findUnique({ where: { id: donation.providerId } })
        : null;
    
      const inventories = await this.prismaService.inventory.findMany({
        where: { donationId }
      });
    
      // 5. Crear el documento PDF
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      doc.pipe(fs.createWriteStream(filePath));
    
      // 4. Insertar el logotipo (ajusta la ruta)
      try {
        doc.image('src/assets/logo.png', 30, 0, { width: 150 });
      } catch (err) {
        console.warn('No se pudo cargar el logotipo:', err);
      }
    
      // 5. Encabezado y datos principales
      doc.fontSize(10).text('FACTURA NO COMERCIAL', 45, 30, { align: 'center' });
      doc.fontSize(8).text('ASISTENCIA DE SALUD\nNO PARA RE-VENTA O FINES COMERCIALES', 45, 45, { align: 'center' });
      doc.moveDown();
    
      doc.fontSize(9);
      doc.text(`NUMERO DE DONACION: D-${donation.id}`, 30, 80);
      doc.text(`FECHA: ${donation.date.toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 350, 80);
      doc.text(`PROVEEDOR: ${provider?.name || '---'}`, 30, 100);
      doc.text(`NOMBRE: ${institution?.name || ''}`, 30, 115);
      doc.text(`RIF.: ${institution?.rif || 'SIN INF.'}`, 350, 115);
      doc.text(`DIRECCION: ${institution?.address || ''}`, 30, 130);
      doc.text(`PAIS: ${institution?.country || ''}`, 30, 145);
      doc.text(`CORREO-E: ${institution?.email || ''}`, 350, 145)
    
      doc.moveDown(2);
    
      // 6. Título de la tabla
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#1997B1').text('LISTA DE MEDICAMENTOS', 45,175, { align: 'center' });
      doc.moveDown(0.5);
    

      
      // Definir columnas con anchos
      const columns = [
        { header: 'N°', width: 25 },
        { header: 'ID', width: 35 },
        { header: 'PRODUCTO', width: 130 },
        { header: 'CANT', width: 35 },
        { header: 'UND', width: 35 },
        { header: 'NDC', width: 35 },
        { header: 'LOTE', width: 55 },
        { header: 'ORIGEN', width: 45 },
        { header: 'F. ADMISION', width: 70 },
        { header: 'F. VENCE', width: 70 },
        { header: 'VALOR', width: 50 },
      ];
      
      // Ajustar el ancho total y posición (startX) según columnas
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
      const startX = doc.page.margins.left + (pageWidth - tableWidth) / 2;
      
      let startY = doc.y;
      const rowHeight = 20;
      
      // Función para dibujar bordes
      function drawCellBorder(x: number, y: number, width: number, height: number) {
        doc.lineWidth(0.5).rect(x, y, width, height).stroke();
      }
      
      // Dibujar encabezados
      let x = startX;
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#1997B1');
      for (const col of columns) {
        doc.text(col.header, x + 2, startY + 5, { width: col.width - 4, align: 'center' });
        drawCellBorder(x, startY, col.width, rowHeight);
        x += col.width;
      }
      startY += rowHeight;
      
      doc.font('Helvetica').fontSize(8).fillColor('black');
      
      // Dibujar filas
      donation.detDonation.forEach((det, idx) => {
        x = startX;
      
        const inventory = inventories.find(inv => inv.medicineId === det.medicineId);
      
        // Formatear fechas
        const admissionDate = inventory?.admissionDate
          ? new Date(inventory.admissionDate).toLocaleDateString('es-VE')
          : 'S/D';
      
        const expirationDate = inventory?.expirationDate
          ? new Date(inventory.expirationDate).toLocaleDateString('es-VE')
          : 'S/D';
      
        const row = [
          (idx + 1).toString(),
          det.medicine.id.toString(),
          det.medicine.name,
          det.amount.toString(),
          det.medicine.unit,
          'NDC',
          donation.lote || '',
          'S/N',
          admissionDate,
          expirationDate,
          '0,00',
        ];
      
        for (let i = 0; i < columns.length; i++) {
          doc.text(row[i], x + 2, startY + 5, { width: columns[i].width - 4, align: 'center' });
          drawCellBorder(x, startY, columns[i].width, rowHeight);
          x += columns[i].width;
        }
      
        startY += rowHeight;
      });
    
      doc.end();
    }
}

// 🤡🤡🤡🤡🤡🤡
// 🤡🤡🤡🤡🤡🤡