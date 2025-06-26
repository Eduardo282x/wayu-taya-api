import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { HistoryQueryDto, InventoryDto, InventoryOutDto } from './inventory.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';
import { Store } from '@prisma/client';

@Injectable()
export class InventoryService {
    constructor(private prisma: PrismaService) {
    }

    async getInventory() {
        const inventory = await this.prisma.inventory.findMany({
            include: {
                donation: true,
                medicine: true,
                store: true,
            },
        });

        const groupedByMedicine = inventory.reduce((acc, item) => {
            const medicineId = item.medicine.id;
            if (!acc[medicineId]) {
                acc[medicineId] = {
                    id: item.id,
                    medicine: item.medicine,
                    totalStock: 0,
                    stores: [] as { id: number, name: string, address: string, amount: number }[],
                    datesMedicine: [],
                    lotes: [] as string[],
                };
            }
            acc[medicineId].totalStock += item.stock;

            if (!acc[medicineId].stores.some(s => s.id === item.store.id)) {
                const totalAmountStore = inventory
                    .filter(inv => inv.medicine.id === medicineId && inv.store.id === item.store.id)
                    .reduce((sum, inv) => sum + inv.stock, 0);
                acc[medicineId].stores.push({
                    id: item.store.id,
                    name: item.store.name,
                    address: item.store.address,
                    amount: totalAmountStore,
                });
            }

            acc[medicineId].datesMedicine.push({
                admissionDate: item.admissionDate,
                expirationDate: item.expirationDate,
            })

            if (!acc[medicineId].lotes.includes(item.donation.lote)) {
                acc[medicineId].lotes.push(item.donation.lote);
            }

            return acc;
        }, {} as Record<number, {
            id: number,
            medicine: typeof inventory[number]['medicine'],
            totalStock: number,
            stores: { id: number, name: string, address: string, amount: number }[],
            datesMedicine: any[],
            lotes: string[],
        }>);

        return Object.values(groupedByMedicine);
    }
/*
    async createInventoryOld(inventory: InventoryDto) {
        try {
            // register for Inventory
            const dataInventory = inventory.medicines.map(item => {
                return {
                    donationId: inventory.donationId,
                    medicineId: item.medicineId,
                    stock: item.stock,
                    storeId: item.storeId,
                    admissionDate: item.admissionDate,
                    expirationDate: item.expirationDate
                }
            })

            await this.prisma.inventory.createMany({
                data: dataInventory,
            });

            const dataHistorialInventory = dataInventory.map(item => {
                return {
                    ...item,
                    type: inventory.type,
                    amount: item.stock,
                    date: new Date(),
                    observations: inventory.observations,
                }
            })

            // register for History 
            await this.prisma.historyInventory.createMany({
                data: dataHistorialInventory,
            });

            baseResponse.message = 'Guardado en el inventario exitosamente.';
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error guardar en el inventario: ' + error
            return badResponse;
        }
    }
*/
    async getHistory(query: HistoryQueryDto) {
        try {
            const where: any = {};
            if (query.from || query.to) {
                where.date = {};
                if (query.from) where.date.gte = new Date(query.from);
                if (query.to) where.date.lte = new Date(query.to);
            }

            return this.prisma.historyInventory.findMany({
                where,
                orderBy: { date: 'desc' },
                include: {
                    medicine: true,
                    store: true,
                    donation: true,
                },
            });

        } catch (error) {
            badResponse.message = 'Error al obtener el historial del inventario: ' + error;
            return badResponse;
        }
    }

    async createInventory(tx: any, inventory: InventoryDto) {
      for (const item of inventory.medicines) {
        const donation = await tx.donation.findUnique({
          where: { id: inventory.donationId },
          select: { lote: true }
        });
    
        if (!donation) {
          throw new Error(`Donación con ID ${inventory.donationId} no encontrada.`);
        }
    
        const existingRecord = await tx.inventory.findFirst({
          where: {
            medicineId: item.medicineId,
            storeId: item.storeId,
            donation: { lote: donation.lote }
          },
          include: { donation: true }
        });
    
        if (existingRecord) {
          await tx.inventory.update({
            where: { id: existingRecord.id },
            data: {
              stock: { increment: item.stock },
              updateAt: new Date(),
            }
          });
    
          await tx.historyInventory.create({
            data: {
              medicineId: existingRecord.medicineId,
              storeId: existingRecord.storeId,
              donationId: existingRecord.donationId,
              amount: item.stock,
              type: inventory.type,
              date: inventory.date,
              observations: inventory.observations || '',
              admissionDate: existingRecord.admissionDate,
              expirationDate: existingRecord.expirationDate,
            },
          });
    
        } else {
          const newInventory = await tx.inventory.create({
            data: {
              donationId: inventory.donationId,
              medicineId: item.medicineId,
              storeId: item.storeId,
              stock: item.stock,
              admissionDate: item.admissionDate,
              expirationDate: item.expirationDate,
            },
          });
    
          await tx.historyInventory.create({
            data: {
              donationId: newInventory.donationId,
              medicineId: newInventory.medicineId,
              storeId: newInventory.storeId,
              type: 'Entrada',
              amount: item.stock,
              date: inventory.date,
              observations: inventory.observations || '',
              admissionDate: newInventory.admissionDate,
              expirationDate: newInventory.expirationDate,
            }
          });
        }
      }
    
      return {
        success: true,
        message: 'Inventario actualizado correctamente.'
      };
    }
    

    async removeInventory(tx: any, inventoryOut: InventoryDto) {
      for (const item of inventoryOut.medicines) {
        const inventoryRecord = await tx.inventory.findFirst({
          where: {
            medicineId: item.medicineId,
            storeId: item.storeId,
          },
        });
    
        if (!inventoryRecord) {
          throw new Error(`No se encontró inventario para medicina ${item.medicineId} en almacén ${item.storeId}.`);
        }
    
        if (inventoryRecord.stock < item.stock) {
          throw new Error(`Stock insuficiente para medicina ${item.medicineId}: disponible ${inventoryRecord.stock}, solicitado ${item.stock}.`);
        }
    
        if (inventoryRecord.stock === item.stock) {
          await tx.inventory.delete({ where: { id: inventoryRecord.id } });
        } else {
          await tx.inventory.update({
            where: { id: inventoryRecord.id },
            data: {
              stock: { decrement: item.stock },
              updateAt: new Date(),
            },
          });
        }
    
        await tx.historyInventory.create({
          data: {
            medicineId: item.medicineId,
            storeId: item.storeId,
            donationId: inventoryOut.donationId,
            amount: item.stock,
            type: 'Salida',
            date: inventoryOut.date,
            observations: inventoryOut.observations || '',
            admissionDate: inventoryRecord.admissionDate,
            expirationDate: inventoryRecord.expirationDate,
          },
        });
      }
    
      return {
        success: true,
        message: 'Salida registrada correctamente.'
      };
    }
    
    
    async revertInventoryWithHistory(tx: any, originalDonation: any) {
      interface HistoryRecord {
        id: number;
        medicineId: number;
        storeId: number;
        donationId: number;
        amount: number;
        type: string;
        date: Date;
        observations: string | null;
        admissionDate: Date;
        expirationDate: Date;
        createAt: Date;
        updateAt: Date;
      }
    
      try {
        // Solo se considera historial original (evita acumular actualizaciones anteriores)
        const historyRecords = await tx.historyInventory.findMany({
          where: {
            donationId: originalDonation.id,
            type: { in: ['Entrada', 'Salida'] },
            observations: {
              not: {
                contains: 'Actualización con dependencias posteriores'
              }
            }
          },
          orderBy: { id: 'asc' }
        }) as HistoryRecord[];
    
        const groupedRecords: Record<string, HistoryRecord[]> = {};
        for (const record of historyRecords) {
          const key = `${record.medicineId}-${record.storeId}`;
          if (!groupedRecords[key]) groupedRecords[key] = [];
          groupedRecords[key].push(record);
        }
    
        for (const [key, records] of Object.entries(groupedRecords)) {
          const [medicineId, storeId] = key.split('-').map(Number);
          const typedRecords = records as HistoryRecord[];
    
          let netChange = 0;
          for (const record of typedRecords) {
            netChange += record.type === 'Entrada' ? record.amount : -record.amount;
          }
    
          const currentInventory = await tx.inventory.findFirst({
            where: { medicineId, storeId }
          });
    
          const isEntry = originalDonation.type === 'Entrada';
          let newStock = currentInventory?.stock || 0;
          let adjustment = 0;
    
          if (isEntry) {
            newStock -= netChange;
          } else {
            newStock += Math.abs(netChange);
          }
    
          if (newStock < 0) {
            adjustment = newStock;
            newStock = 0;
          }
    
          const observations = adjustment < 0
            ? `Reversión ajustada (${adjustment}) por stock negativo | ${originalDonation.id}`
            : `Reversión de donación ${originalDonation.id}`;
    
          if (currentInventory) {
            if (newStock === 0) {
              await tx.inventory.delete({ 
                where: { id: currentInventory.id } 
              });
            } else {
              await tx.inventory.update({
                where: { id: currentInventory.id },
                data: { 
                  stock: newStock,
                  updateAt: new Date() 
                }
              });
            }
          } else if (newStock > 0) {
            await tx.inventory.create({
              data: {
                donationId: originalDonation.id,
                medicineId,
                storeId,
                stock: newStock,
                admissionDate: typedRecords[0].admissionDate,
                expirationDate: typedRecords[0].expirationDate
              }
            });
          }
    
          const reversionType = isEntry ? 'Reversión Entrada' : 'Reversión Salida';
          await tx.historyInventory.create({
            data: {
              medicineId,
              storeId,
              donationId: originalDonation.id,
              amount: Math.abs(netChange),
              type: reversionType,
              date: new Date(),
              observations,
              admissionDate: typedRecords[0].admissionDate,
              expirationDate: typedRecords[0].expirationDate
            }
          });
        }
    
        return { success: true, message: 'Reversión completada exitosamente' };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        throw new Error(`Fallo en reversión por historial: ${message}`);
      }
    }
      
}
