import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { HistoryQueryDto, InventoryDto, InventoryMoveDto, InventoryOutDTO } from './inventory.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class InventoryService {
    constructor(private readonly prisma: PrismaService) {
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
                    lotes: [] as { name: string, storeId: number, medicineId: number, expirationDate: Date, admissionDate: Date }[],
                    expirationSet: new Set<string>(),
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

            // acc[medicineId].datesMedicine.push({
            //   admissionDate: item.admissionDate,
            //   expirationDate: item.expirationDate,
            // })

            const expDateStr = item.expirationDate.toISOString();
            if (!acc[medicineId].expirationSet.has(expDateStr)) {
                acc[medicineId].datesMedicine.push({
                    admissionDate: item.admissionDate,
                    expirationDate: item.expirationDate,
                });
                acc[medicineId].expirationSet.add(expDateStr);
            }

            if (!acc[medicineId].lotes.some(lote => lote.name === item.donation.lote)) {
                acc[medicineId].lotes.push({
                    name: item.donation.lote,
                    storeId: item.store.id,
                    medicineId: item.medicine.id,
                    expirationDate: item.expirationDate,
                    admissionDate: item.admissionDate,
                });
            }

            return acc;
        }, {} as Record<number, {
            id: number,
            medicine: typeof inventory[number]['medicine'],
            totalStock: number,
            stores: { id: number, name: string, address: string, amount: number }[],
            datesMedicine: any[],
            lotes: { name: string, storeId: number, medicineId: number, expirationDate: Date, admissionDate: Date }[],
            expirationSet: Set<string>,
        }>);

        return Object.values(groupedByMedicine).map(item => {
            const { expirationSet, ...rest } = item;
            return rest;
        });
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
    async getHistory(query?: HistoryQueryDto) {
        try {
            const where: any = {};
            if (query) {
                const fromDate = query.from && !isNaN(Date.parse(query.from.toString())) ? new Date(query.from) : null;
                const toDate = query.to && !isNaN(Date.parse(query.to.toString())) ? new Date(query.to) : null;

                if (fromDate || toDate) {
                    where.date = {};
                    if (fromDate) where.date.gte = fromDate;
                    if (toDate) where.date.lte = toDate;
                }
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

    async processInventory(inventory: InventoryDto, tx?: any) {
        const prismaService = tx || this.prisma;
        const executor = tx
            ? async (cb: (trx: any) => Promise<any>) => cb(prismaService)
            : this.prisma.$transaction.bind(this.prisma);

        return await executor(async (trx) => {
            // Validación de duplicado exacto: donación ya procesada con mismos datos
            const duplicado = await trx.historyInventory.findMany({
                where: {
                    donationId: inventory.donationId,
                    type: inventory.type,
                    date: inventory.date,
                    observations: inventory.observations,
                },
            });

            if (duplicado.length === inventory.medicines.length) {
                const coincide = duplicado.every(hist => {
                    const med = inventory.medicines.find(m => m.medicineId === hist.medicineId && m.storeId === hist.storeId);
                    return med && med.stock === hist.amount;
                });

                if (coincide) {
                    throw new Error('Esta acción de inventario ya fue aplicada con los mismos detalles.');
                }
            }

            // Eliminar historial anterior si es actualización
            if (inventory.observations?.includes('Actualización con dependencias posteriores')) {
                await trx.historyInventory.deleteMany({
                    where: {
                        donationId: inventory.donationId,
                        observations: 'Actualización con dependencias posteriores'
                    }
                });
            }

            const lote = inventory.lote || (await trx.donation.findUnique({
                where: { id: inventory.donationId },
                select: { lote: true }
            }))?.lote;

            if (!lote) throw new Error('No se pudo determinar el lote de la donación.');

            for (const item of inventory.medicines) {
                const baseWhere = {
                    medicineId: item.medicineId,
                    storeId: item.storeId,
                    donation: { lote }
                };

                const record = await trx.inventory.findFirst({ where: baseWhere });

                if (inventory.type === 'Entrada') {
                    if (record) {
                        await trx.inventory.update({
                            where: { id: record.id },
                            data: {
                                stock: { increment: item.stock },
                                updateAt: new Date(),
                            }
                        });

                        await trx.historyInventory.create({
                            data: {
                                medicineId: item.medicineId,
                                storeId: item.storeId,
                                donationId: record.donationId,
                                amount: item.stock,
                                type: 'Entrada',
                                date: inventory.date,
                                observations: inventory.observations || '',
                                admissionDate: record.admissionDate,
                                expirationDate: record.expirationDate
                            },
                        });

                    } else {
                        const nuevo = await trx.inventory.create({
                            data: {
                                donationId: inventory.donationId,
                                medicineId: item.medicineId,
                                storeId: item.storeId,
                                stock: item.stock,
                                admissionDate: item.admissionDate,
                                expirationDate: item.expirationDate,
                            },
                        });

                        await trx.historyInventory.create({
                            data: {
                                donationId: nuevo.donationId,
                                medicineId: nuevo.medicineId,
                                storeId: nuevo.storeId,
                                type: 'Entrada',
                                amount: item.stock,
                                date: inventory.date,
                                observations: inventory.observations || '',
                                admissionDate: nuevo.admissionDate,
                                expirationDate: nuevo.expirationDate,
                            }
                        });
                    }
                } else if (inventory.type === 'Salida') {
                    if (!record) {
                        throw new Error(`No se encontró inventario para medicina ${item.medicineId} en almacén ${item.storeId}.`);
                    }

                    if (record.stock < item.stock) {
                        throw new Error(`Stock insuficiente para medicina ${item.medicineId}: disponible ${record.stock}, solicitado ${item.stock}.`);
                    }

                    if (record.stock === item.stock) {
                        await trx.inventory.delete({ where: { id: record.id } });
                    } else {
                        await trx.inventory.update({
                            where: { id: record.id },
                            data: {
                                stock: { decrement: item.stock },
                                updateAt: new Date(),
                            }
                        });
                    }

                    await trx.historyInventory.create({
                        data: {
                            medicineId: item.medicineId,
                            storeId: item.storeId,
                            donationId: inventory.donationId,
                            amount: item.stock,
                            type: 'Salida',
                            date: inventory.date,
                            observations: inventory.observations || '',
                            admissionDate: record.admissionDate,
                            expirationDate: record.expirationDate,
                        },
                    });
                }
            }

            return {
                success: true,
                message: `Inventario procesado correctamente como ${inventory.type}`
            };
        });
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

    async transferMedicineBetweenStores(params: InventoryMoveDto) {
        try {
            return await this.prisma.$transaction(async (tx) => {
                for (const movement of params.movements) {
                    const {
                        medicineId,
                        sourceStoreId,
                        quantity,
                        targetStoreId,
                    } = movement;

                    // Buscar la entrada en inventario desde el almacén fuente
                    const sourceInventory = await tx.inventory.findFirst({
                        where: {
                            medicineId,
                            storeId: sourceStoreId,
                        },
                    });

                    if (!sourceInventory || sourceInventory.stock < quantity) {
                        throw new Error(
                            `Stock insuficiente en el almacén fuente (Medicina ID: ${medicineId}, Almacén ID: ${sourceStoreId}).`
                        );
                    }

                    // Reducir stock del almacén fuente
                    const reduceAmount = await tx.inventory.update({
                        where: { id: sourceInventory.id },
                        data: {
                            stock: {
                                decrement: quantity,
                            },
                        },
                    });

                    if (reduceAmount.stock == 0) {
                        await tx.inventory.delete({
                            where: { id: sourceInventory.id }
                        })
                    }

                    // Verificar si ya existe entrada en el almacén destino con mismo lote
                    const destinationInventory = await tx.inventory.findFirst({
                        where: {
                            medicineId,
                            storeId: targetStoreId,
                            donationId: sourceInventory.donationId,
                            admissionDate: sourceInventory.admissionDate,
                            expirationDate: sourceInventory.expirationDate,
                        },
                    });

                    if (destinationInventory) {
                        // Si existe, incrementar stock
                        await tx.inventory.update({
                            where: { id: destinationInventory.id },
                            data: {
                                stock: {
                                    increment: quantity,
                                },
                            },
                        });
                    } else {
                        // Si no existe, crear nueva entrada
                        await tx.inventory.create({
                            data: {
                                medicineId,
                                storeId: targetStoreId,
                                donationId: sourceInventory.donationId,
                                admissionDate: sourceInventory.admissionDate,
                                expirationDate: sourceInventory.expirationDate,
                                stock: quantity,
                            },
                        });
                    }
                }

                return { success: true, message: 'Todas las transferencias fueron completadas con éxito.' };
            });
        } catch (error) {
            console.error('Error en la transferencia de inventario:', error);
            throw new Error(`No se pudo completar la transferencia: ${error}`);
        }
    }

    async removeInventory(data: InventoryOutDTO) {
        try {
            // find in the inventory the record
            const inventory = await this.prisma.inventory.findFirst({
                where: {
                    medicineId: data.medicineId,
                    storeId: data.storeId,
                },
            });

            const findDonation = await this.prisma.detDonation.findFirst({
                where: {
                    medicineId: data.medicineId,
                }
            })

            if (!inventory) {
                badResponse.message = 'No se encontró el inventario para esta medicina y almacén.';
                return badResponse;
            }

            const amount = data.amount;
            if (inventory.stock < amount) {
                badResponse.message = `Cantidad insuficiente: hay ${inventory.stock}, se solicitó ${amount}`;
                return badResponse;
            }

            //update or delete stock
            await this.prisma.$transaction(async (tx) => {
                if (inventory.stock - amount === 0) {
                    // if stock is 0, delete the record
                    await tx.inventory.delete({
                        where: { id: inventory.id },
                    });
                } else {
                    // if theres still stock, decrement the amount
                    await tx.inventory.update({
                        where: { id: inventory.id },
                        data: {
                            stock: { decrement: amount },
                            updateAt: new Date(),
                        },
                    });
                }

                // register in history
                await tx.historyInventory.create({
                    data: {
                        medicineId: data.medicineId,
                        storeId: data.storeId,
                        donationId: findDonation.donationId,
                        amount: data.amount,
                        type: 'Salida',
                        date: new Date(),
                        observations: data.observations,
                        admissionDate: inventory.admissionDate,
                        expirationDate: inventory.expirationDate,
                    },
                });
            });

            baseResponse.message = 'Salida registrada correctamente del inventario.';
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error la registrar la salida del inventario: ' + error
            return badResponse;
        }

    }

}
