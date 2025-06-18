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

        const groupedByMedicine = inventory.reduce((accu, item) => {
            const medicineId = item.medicine.id;
            if (!accu[medicineId]) {
                accu[medicineId] = {
                    medicine: item.medicine,
                    totalStock: 0,
                    stores: [] as Store[],
                    datesMedicine: [],
                    lotes: [] as string[],
                };
            }
            accu[medicineId].totalStock += item.stock;

            if (!accu[medicineId].stores.some(s => s.id === item.store.id)) {
                accu[medicineId].stores.push({
                    id: item.store.id,
                    name: item.store.name,
                    address: item.store.address,
                });
            }

            accu[medicineId].datesMedicine.push({
                admissionDate: item.admissionDate,
                expirationDate: item.expirationDate,
            })

            if (!accu[medicineId].lotes.includes(item.donation.lote)) {
                accu[medicineId].lotes.push(item.donation.lote);
            }

            return accu;
        }, {} as Record<number, {
            medicine: typeof inventory[number]['medicine'],
            totalStock: number,
            stores: Store[],
            datesMedicine: any[],
            lotes: string[],
        }>);

        return Object.values(groupedByMedicine);
    }

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

    async createInventory(inventory: InventoryDto) {
        try {
            for (const item of inventory.medicines) {
                const donation = await this.prisma.donation.findUnique({
                    where: { id: inventory.donationId },
                    select: { lote: true }
                });

                if (!donation) {
                    badResponse.message = 'Donación no encontrada.';
                    return badResponse;
                }

                const findInventory = await this.prisma.inventory.findFirst({
                    where: {
                        medicineId: item.medicineId,
                        storeId: item.storeId,
                        donation: { lote: donation.lote }
                    },
                    include: { donation: true }
                });

                if (findInventory) {
                    // if the inventory exists, update the stock
                    const updatedInventory = await this.prisma.inventory.update({
                        where: { id: findInventory.id },
                        data: {
                            stock: { increment: item.stock },
                            updateAt: new Date(),
                        }
                    });

                    // register for HistoryInventory
                    const dataHistorialInventory = {
                        medicineId: updatedInventory.medicineId,
                        storeId: updatedInventory.storeId,
                        donationId: updatedInventory.donationId,
                        amount: item.stock,
                        type: inventory.type,
                        date: inventory.date,
                        observations: inventory.observations,
                        admissionDate: updatedInventory.admissionDate,
                        expirationDate: updatedInventory.expirationDate,
                    };

                    await this.prisma.historyInventory.create({
                        data: dataHistorialInventory,
                    });

                } else {
                    // new register if it doesn't exist
                    const inventoryRecord = await this.prisma.inventory.create({
                        data: {
                            donationId: inventory.donationId,
                            medicineId: item.medicineId,
                            stock: item.stock,
                            storeId: item.storeId,
                            admissionDate: item.admissionDate,
                            expirationDate: item.expirationDate,
                        },
                    });
                    // register for HistoryInventory
                    await this.prisma.historyInventory.createMany({
                        data: {
                            donationId: inventoryRecord.donationId,
                            medicineId: inventoryRecord.medicineId,
                            storeId: inventoryRecord.storeId,
                            type: 'Entrada',
                            amount: item.stock,
                            date: inventory.date,
                            observations: inventory.observations,
                            admissionDate: inventoryRecord.admissionDate,
                            expirationDate: inventoryRecord.expirationDate,
                        }
                    });
                }
            }

            baseResponse.message = 'Guardado en el inventario exitosamente.';
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error guardar en el inventario: ' + error
            return badResponse;
        }
    }

    async removeInventory(inventoryOut: InventoryDto) {
        const errores = [];
        for (const item of inventoryOut.medicines) {
            try {
                const inventoryRecord = await this.prisma.inventory.findFirst({
                    where: {
                        medicineId: item.medicineId,
                        storeId: item.storeId,
                    },
                });

                if (!inventoryRecord) {
                    errores.push(`No se encontró inventario para medicina ${item.medicineId} en almacén ${item.storeId}.`);
                    continue;
                }

                if (inventoryRecord.stock < item.stock) {
                    errores.push(`Stock insuficiente para medicina ${item.medicineId}: disponible ${inventoryRecord.stock}, solicitado ${item.stock}.`);
                    continue;
                }

                if (inventoryRecord.stock === item.stock) {
                    await this.prisma.inventory.delete({ where: { id: inventoryRecord.id } });
                } else {
                    await this.prisma.inventory.update({
                        where: { id: inventoryRecord.id },
                        data: {
                            stock: { decrement: item.stock },
                            updateAt: new Date(),
                        },
                    });
                }

                await this.prisma.historyInventory.create({
                    data: {
                        medicineId: item.medicineId,
                        storeId: item.storeId,
                        donationId: inventoryOut.donationId,
                        amount: item.stock,
                        type: 'Salida',
                        date: inventoryOut.date,
                        observations: inventoryOut.observations,
                        admissionDate: inventoryRecord.admissionDate,
                        expirationDate: inventoryRecord.expirationDate,
                    },
                });
            } catch (error) {
                errores.push(`Error procesando medicina ${item.medicineId}: ${error}`);
            }
        }

        if (errores.length > 0) {
            badResponse.message = 'Algunos errores ocurrieron: ' + errores.join('; ');
            return badResponse;
        }

        baseResponse.message = 'Salida registrada correctamente para todas las medicinas.';
        return baseResponse;
    }
}
