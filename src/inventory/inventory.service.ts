import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { HistoryQueryDto, InventoryDto } from './inventory.dto';
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
                    stores: [],
                    datesMedicine: [],
                    lotes: []
                };
            }
            accu[medicineId].totalStock += item.stock;

            accu[medicineId].stores.push({
                id: item.store.id,
                name: item.store.name,
                address: item.store.address,
            });
            accu[medicineId].datesMedicine.push({
                admissionDate: item.admissionDate,
                expirationDate: item.expirationDate,
            })
            accu[medicineId].lotes.push(item.donation.lote)

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

    async createInventory(inventory: InventoryDto) {
        const findInventory = await this.prisma.inventory.findFirst({
            where: { medicineId: 1, storeId: 1, donation: { lote: '' } }
        })

        if (findInventory) {

        } else {

        }
        try {
            // register for Inventory
            const dataInventroy = inventory.medicines.map(item => {
                return {
                    donationId: inventory.donationId,
                    medicineId: item.medicineId,
                    stock: item.stock,
                    storeId: 1,
                    admissionDate: new Date(),
                    expirationDate: new Date()
                }
            })

            await this.prisma.inventory.createMany({
                data: dataInventroy,
            });

            const dataHistorialInventory = dataInventroy.map(item => {
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
        } catch (err) {
            badResponse.message = 'Ha ocurrido un erro'
            return badResponse;
        }
    }

}



