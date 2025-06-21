import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DonationsDTO } from './donations.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';
import { InventoryService } from 'src/inventory/inventory.service';
import { InventoryDto, MedicinesDto,InventoryOutDto } from 'src/inventory/inventory.dto';
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
      return await this.prismaService.$transaction(async (tx) => {
        // Crear la donación principal
        const donationCreated = await tx.donation.create({
          data: {
            institutionId: donation.institutionId,
            providerId: donation.providerId,
            type: donation.type,
            date: donation.date,
            lote: donation.lote,
          },
        });
  
        // Crear los detalles de la donación
        const dataDetDonation = donation.medicines.map((pro) => ({
          donationId: donationCreated.id,
          medicineId: pro.medicineId,
          amount: pro.amount,
        }));
  
        await tx.detDonation.createMany({
          data: dataDetDonation
        });
  
        // Lógica condicional basada en el tipo de donación
        if (donation.type === 'Entrada') {
          // Procesar cada medicina para entrada en inventario
          for (const item of donation.medicines) {
            const findInventory = await tx.inventory.findFirst({
              where: {
                medicineId: item.medicineId,
                storeId: item.storageId,
                donation: { lote: donation.lote }
              },
              include: { donation: true }
            });
  
            if (findInventory) {
              // Actualizar inventario existente
              await tx.inventory.update({
                where: { id: findInventory.id },
                data: {
                  stock: { increment: item.amount },
                  updateAt: new Date(),
                }
              });
            } else {
              // Crear nuevo registro de inventario
              await tx.inventory.create({
                data: {
                  donationId: donationCreated.id,
                  medicineId: item.medicineId,
                  stock: item.amount,
                  storeId: item.storageId,
                  admissionDate: item.admissionDate,
                  expirationDate: item.expirationDate,
                },
              });
            }
  
            // Registrar en historial
            await tx.historyInventory.create({
              data: {
                medicineId: item.medicineId,
                storeId: item.storageId,
                donationId: donationCreated.id,
                amount: item.amount,
                type: 'Entrada',
                date: donation.date,
                observations: '',
                admissionDate: item.admissionDate,
                expirationDate: item.expirationDate,
              },
            });
          }
  
        } else if (donation.type === 'Salida') {
          // Procesar cada medicina para salida de inventario
          for (const item of donation.medicines) {
            const inventory = await tx.inventory.findFirst({
              where: {
                medicineId: item.medicineId,
                storeId: item.storageId,
              },
            });
  
            if (!inventory) {
              throw new Error(`No se encontró inventario para medicina ${item.medicineId} en almacén ${item.storageId}.`);
            }
  
            if (inventory.stock < item.amount) {
              throw new Error(`Stock insuficiente para medicina ${item.medicineId}: disponible ${inventory.stock}, solicitado ${item.amount}.`);
            }
  
            if (inventory.stock === item.amount) {
              await tx.inventory.delete({ where: { id: inventory.id } });
            } else {
              await tx.inventory.update({
                where: { id: inventory.id },
                data: {
                  stock: { decrement: item.amount },
                  updateAt: new Date(),
                },
              });
            }
  
            // Registrar en historial
            await tx.historyInventory.create({
              data: {
                medicineId: item.medicineId,
                storeId: item.storageId,
                donationId: donationCreated.id,
                amount: item.amount,
                type: 'Salida',
                date: donation.date,
                observations: '',
                admissionDate: inventory.admissionDate,
                expirationDate: inventory.expirationDate,
              },
            });
          }
        }
  
        return {
          success: true,
          message: 'Donación creada exitosamente y acción de inventario procesada.',
          data: donationCreated
        };
      });
  
    } catch (error) {
      badResponse.message = 'Error al crear la donación o procesar el inventario: ' + error;
      return badResponse;
    }
  }

  async updateDonation(id: number, donation: DonationsDTO) {
    try {
      return await this.prismaService.$transaction(async (tx) => {
      // 1. Obtener donación original con todos los datos necesarios
      const originalDonation = await tx.donation.findUnique({
        where: { id },
        include: {
          detDonation: true,
          historyInventory: {
            where: { type: { in: ['Entrada', 'Salida'] } }
          },
          inventory: true
        },
      });

      if (!originalDonation) {
        throw new Error('Donación no encontrada');
      }

      // 2. Validación previa de stock (solo para entradas) - CORREGIDA
      if (donation.changeDonDetails && originalDonation.type === 'Entrada') {
        for (const originalMed of originalDonation.detDonation) {
          // Obtener storeId del primer registro histórico
          const medHistory = originalDonation.historyInventory.find(
            h => h.medicineId === originalMed.medicineId
          );
          
          if (!medHistory) {
            throw new Error(
              `Registro histórico no encontrado para medicina ${originalMed.medicineId}`
            );
          }
          
          const storeId = medHistory.storeId;
          
          // Buscar la medicina correspondiente en la actualización
          const updatedMed = donation.medicines.find(m => 
            m.medicineId === originalMed.medicineId && 
            m.storageId === storeId
          );
          
          // Calcular reducción REAL (diferencia entre lo original y lo nuevo)
          const newAmount = updatedMed ? updatedMed.amount : 0;
          const reduction = originalMed.amount - newAmount;
          
          // Solo validar si hay reducción
          if (reduction > 0) {
            // Obtener stock actual CORRECTO: sumar todos los registros
            const inventoryAggregation = await tx.inventory.groupBy({
              by: ['medicineId'],
              where: {
                medicineId: originalMed.medicineId,
                storeId: storeId
              },
              _sum: {
                stock: true
              }
            });
            
            const currentStock = inventoryAggregation[0]?._sum?.stock || 0;
            
            // VALIDACIÓN CRUCIAL: solo aplica si la reducción es mayor que el stock actual
            if (reduction > currentStock) {
              throw new Error(
                `No se puede reducir ${reduction} unidades de medicina ${originalMed.medicineId} en almacén ${storeId}. ` +
                `Stock actual: ${currentStock}. ` +
                `Sugerencia: Actualice a ${currentStock + originalMed.amount - reduction} o menos`
              );
            }
          }
        }
      }
        // 3. Revertir inventario usando datos históricos
        if (donation.changeDonDetails === true) {
          try {
            await this.inventoryService.revertInventoryWithHistory(tx, originalDonation);
          } catch (revertError) {
            const message = revertError instanceof Error 
              ? revertError.message 
              : 'Error desconocido al revertir inventario';
            throw new Error(`Error al revertir inventario original: ${message}`);
          }
        }
  
        // 4. Actualizar la donación principal
        const updatedDonation = await tx.donation.update({
          where: { id },
          data: {
            institutionId: donation.institutionId,
            providerId: donation.providerId,
            type: donation.type,
            date: donation.date,
            lote: donation.lote,
            updateAt: new Date(),
          },
        });
  
        // 5. Actualizar detalles e inventario solo si changeDonDetails es true
        if (donation.changeDonDetails === true) {
          try {
            // Borrar detalles antiguos
            await tx.detDonation.deleteMany({ where: { donationId: id } });
  
            // Crear nuevos detalles (sin storeId ya que no está en el modelo)
            const newDetails = donation.medicines.map((med) => ({
              donationId: id,
              medicineId: med.medicineId,
              amount: med.amount
              // Nota: No incluimos storeId porque no está en el modelo DetDonation
            }));
  
            await tx.detDonation.createMany({
              data: newDetails
            });
  
            // Aplicar cambios en inventario según tipo
            if (updatedDonation.type === 'Entrada') {
              for (const med of donation.medicines) {
                // Buscar inventario por lote y medicina (no usamos storeId en búsqueda)
                const inventoryRecord = await tx.inventory.findFirst({
                  where: {
                    medicineId: med.medicineId,
                    donation: { lote: updatedDonation.lote }
                  }
                });
  
                if (inventoryRecord) {
                  await tx.inventory.update({
                    where: { id: inventoryRecord.id },
                    data: {
                      stock: { increment: med.amount },
                      admissionDate: med.admissionDate,
                      expirationDate: med.expirationDate,
                      updateAt: new Date(),
                    },
                  });
                } else {
                  // Usar storeId del DTO para creación
                  await tx.inventory.create({
                    data: {
                      donationId: updatedDonation.id,
                      medicineId: med.medicineId,
                      storeId: med.storageId, // Usar storageId del DTO
                      stock: med.amount,
                      admissionDate: med.admissionDate,
                      expirationDate: med.expirationDate,
                    },
                  });
                }
  
                // Registrar en historial (usando storageId del DTO)
                await tx.historyInventory.create({
                  data: {
                    medicineId: med.medicineId,
                    storeId: med.storageId, // Usar storageId del DTO
                    donationId: updatedDonation.id,
                    amount: med.amount,
                    type: 'Entrada',
                    date: updatedDonation.date,
                    observations: 'Actualización de donación',
                    admissionDate: med.admissionDate,
                    expirationDate: med.expirationDate,
                  },
                });
              }
            } else if (updatedDonation.type === 'Salida') {
              for (const med of donation.medicines) {
                // Buscar por almacén usando storeId del DTO
                const inventoryRecord = await tx.inventory.findFirst({
                  where: {
                    medicineId: med.medicineId,
                    storeId: med.storageId // Usar storageId del DTO
                  },
                });
  
                if (!inventoryRecord) {
                  throw new Error(`No se encontró inventario para medicina ${med.medicineId} en almacén ${med.storageId}.`);
                }
  
                if (inventoryRecord.stock < med.amount) {
                  throw new Error(`Stock insuficiente para medicina ${med.medicineId}: disponible ${inventoryRecord.stock}, solicitado ${med.amount}.`);
                }
  
                if (inventoryRecord.stock === med.amount) {
                  await tx.inventory.delete({ where: { id: inventoryRecord.id } });
                } else {
                  await tx.inventory.update({
                    where: { id: inventoryRecord.id },
                    data: {
                      stock: { decrement: med.amount },
                      updateAt: new Date(),
                    },
                  });
                }
  
                // Registrar en historial (usando storageId del DTO)
                await tx.historyInventory.create({
                  data: {
                    medicineId: med.medicineId,
                    storeId: med.storageId, // Usar storageId del DTO
                    donationId: updatedDonation.id,
                    amount: med.amount,
                    type: 'Salida',
                    date: updatedDonation.date,
                    observations: 'Actualización de donación',
                    admissionDate: inventoryRecord.admissionDate,
                    expirationDate: inventoryRecord.expirationDate,
                  },
                });
              }
            }
          } catch (detailError) {
            if (detailError instanceof Error) {
              throw new Error(`Error actualizando detalles de donación: ${detailError.message}`);
            }
            throw detailError;
          }
        }
  
        return {
          success: true,
          message: 'Donación actualizada correctamente.',
          data: updatedDonation,
        };
      });
    } catch (error) {
      const message = error instanceof Error 
        ? error.message 
        : 'Error desconocido al actualizar la donación';
      return {
        success: false,
        message,
      };
    }
  }

  async deleteDonation(id: number) {
    try {
      return await this.prismaService.$transaction(async (tx) => {
        // Obtener la donación con todos sus datos relacionados
        const donation = await tx.donation.findUnique({
          where: { id },
          include: { 
            detDonation: true,
            historyInventory: true  // Asegurarnos de tener datos históricos
          },
        });
  
        if (!donation) {
          throw new Error('Donación no encontrada');
        }
  
        // Revertir inventario usando datos históricos
        await this.inventoryService.revertInventoryWithHistory(tx, donation);
  
        // Eliminar registros relacionados en orden seguro
        await tx.historyInventory.deleteMany({ 
          where: { donationId: id } 
        });
        
        await tx.detDonation.deleteMany({ 
          where: { donationId: id } 
        });
        
        await tx.inventory.deleteMany({
          where: { donationId: id }
        });
  
        // Finalmente borrar la donación principal
        const deletedDonation = await tx.donation.delete({ 
          where: { id } 
        });
  
        return {
          success: true,
          message: 'Donación eliminada y cambios en inventario revertidos correctamente',
          data: deletedDonation
        };
      });
    } catch (error) {
      return {
        success: false,
        message: 'Error al eliminar la donación: ' + 
                 (error instanceof Error ? error.message : String(error)),
      };
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
doc.text('Sello:', selloX,cuadrosY-20);
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
// 🤡🤡🤡🤡🤡🤡