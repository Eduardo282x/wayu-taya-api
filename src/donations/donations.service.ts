import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DonationsDTO } from './donations.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';
import { InventoryService } from 'src/inventory/inventory.service';
import { InventoryDto, MedicinesDto, InventoryOutDto } from 'src/inventory/inventory.dto';
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
      const donationCreated = await this.prismaService.donation.create({
        data: {
          institutionId: donation.institutionId,
          providerId: donation.providerId,
          type: donation.type, // 'Entrada' o 'Salida'
          date: donation.date,
          lote: donation.lote,
        },
      });

      const dataDetDonation = donation.medicines.map((pro) => {
        return {
          donationId: donationCreated.id,
          medicineId: pro.medicineId,
          amount: pro.amount,
        };
      });

      await this.prismaService.detDonation.createMany({
        data: dataDetDonation
      });

      if (donation.type === 'Entrada') {
        const dataDetDonation4Inv: MedicinesDto[] = donation.medicines.map((pro) => {
          return {
            medicineId: pro.medicineId,
            stock: pro.amount,
            storeId: pro.storageId,
            admissionDate: pro.admissionDate,
            expirationDate: pro.expirationDate
          };
        });

        const dataInventory: InventoryDto = {
          donationId: donationCreated.id,
          type: donationCreated.type, // >'Entrada'<
          date: donationCreated.date,
          medicines: dataDetDonation4Inv,
          observations: '',
        };

        await this.inventoryService.createInventory(dataInventory);

      } else if (donation.type === 'Salida') {
        const dataDetDonation4Out: MedicinesDto[] = donation.medicines.map((pro) => {
          return {
            medicineId: pro.medicineId,
            stock: pro.amount, // 'stock' a eliminar
            storeId: pro.storageId,
            admissionDate: pro.admissionDate,
            expirationDate: pro.expirationDate,
          };
        });

        const dataInventoryOut: InventoryDto = {
          donationId: donationCreated.id,
          type: donationCreated.type, // >'Salida'<
          date: donationCreated.date,
          medicines: dataDetDonation4Out,
          observations: '',
        };

        await this.inventoryService.removeInventory(dataInventoryOut);
      }

      baseResponse.message = 'Donación creada exitosamente y acción de inventario procesada.';
      return baseResponse;

    } catch (error) {
      badResponse.message = 'Error al crear la donación o procesar el inventario: ' + error;
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

    const filePDF = await new Promise(resolve => {
      // 5. Crear el documento PDF
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      doc.pipe(fs.createWriteStream(filePath));

      // --- PAGINA 1: CERTIFICADO DE DONACIÓN ---
      // Logo
      try {
        doc.image('src/assets/logo.png', 40, 0, { width: 150 });
      } catch (err) {
        console.warn('No se pudo cargar el logotipo:', err);
      }

      // Fecha arriba a la derecha
      const fechaActual = new Date().toLocaleDateString('es-VE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.fontSize(10).text(fechaActual, 0, 40, { align: 'right' });

      // Nombre y RIF de la fundación
      doc.font('Helvetica-Bold').fontSize(11).text('Fundación Wayuu Taya', 40, 90);
      doc.font('Helvetica-Bold').fontSize(10).text('J-309554050', 40, 105);

      // Título centrado
      doc.moveDown(2);
      doc.font('Helvetica-Bold').fontSize(13).text('CERTIFICADO DE DONACIÓN', { align: 'center' });
      doc.moveDown(1);

      // Datos principales
      doc.font('Helvetica').fontSize(10);
      doc.text(`NUMERO DE DONACION: D-${donation.id}`, 40, 160);
      doc.text(`CONSIGNATARIO: ${institution?.name || ''}`, 40, 175);
      doc.text(`RIF.: ${institution?.rif || ''}`, 40, 190);
      doc.text(`FECHA: ${donation.date.toLocaleDateString('es-VE', { year: 'numeric', month: '2-digit', day: '2-digit' })}`, 40, 205);

      // Texto principal
      doc.moveDown(8);
      doc.font('Helvetica').fontSize(10);
      doc.text(
        'Este documento certifica que La Fundación Wayuu Taya ha donado provisiones médicas al consignatario mencionado arriba. Este envío es un regalo de buena fe sin ninguna consideración de valor monetario de parte del que lo reciba con respecto al valor comercial de las provisiones médicas.',
        { align: 'justify', width: 500 }
      );

      // Espacio para firma y sellos
      doc.moveDown(8);
      doc.text('Atentamente,', 40);

      // Definir altura y márgenes para los cuadros y texto al final de la página
      const bottomMargin = 250;
      const pageHeight = doc.page.height;
      const cuadroFirmaWidth = 250;
      const cuadroFirmaHeight = 0;
      const cuadroSelloWidth = 120;
      const cuadroSelloHeight = 120;
      const espacioEntreCuadros = 40;

      // Posiciones Y para los cuadros y texto (cerca del pie)
      const cuadrosY = pageHeight - bottomMargin - cuadroFirmaHeight;
      const firmaX = 100;
      const selloX = firmaX + cuadroFirmaWidth + espacioEntreCuadros;

      // Dibujar rectángulos para firma y sello
      doc.rect(firmaX, cuadrosY, cuadroFirmaWidth, cuadroFirmaHeight).stroke();
      doc.text('Sello:', selloX, cuadrosY - 20);
      doc.rect(selloX, cuadrosY, cuadroSelloWidth, cuadroSelloHeight).strokeOpacity(0.2).stroke();

      // Información de Roger centrada dentro del cuadro de firma, justo debajo del rectángulo
      const infoRoger = [
        'FUNDACIÓN WAYUU TAYA',
        'RIF J-30955405-0',
        'Roger Ibarra',
        'Gerente Regional Zulia',
        'roger@wayuutaya.org / www.wayuutaya.org',
      ];

      const infoYStart = cuadrosY + cuadroFirmaHeight + 5; // 5 pts debajo del cuadro firma

      infoRoger.forEach((line, index) => {
        doc.font('Helvetica').fontSize(9).text(line, firmaX, infoYStart + index * 12, {
          width: cuadroFirmaWidth,
          align: 'center',
        });

      });
      // Pie de página
      doc.font('Helvetica').fontSize(8).text(
        'AV 13A ENTRE CALLES 75 Y 76 EDIF BELEN PISO PRIMER 1-C SECTOR TIERRA NEGRA MARACAIBO ZULIA',
        40, doc.page.height - 60, { align: 'center' }
      );


      // --- PAGINA 2: TABLA DE MEDICAMENTOS ---
      doc.addPage();

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
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#1997B1').text('LISTA DE MEDICAMENTOS', 45, 175, { align: 'center' });
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

      const buffer = [];
      doc.on('data', buffer.push.bind(buffer))
      doc.on('end', () => {
        const data = Buffer.concat(buffer)
        resolve(data)
      })

      doc.end()
    })

    return filePDF;
  }
}

// 🤡🤡🤡🤡🤡🤡
// 🤡🤡🤡🤡🤡🤡
// 🤡🤡🤡🤡🤡🤡