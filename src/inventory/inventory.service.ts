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
                };
            }
            accu[medicineId].totalStock += item.stock;

            accu[medicineId].stores.push({
                id: item.store.id,
                name: item.store.name,
                address: item.store.address,
            });

            return accu;
        }, {} as Record<number, {
            medicine: typeof inventory[number]['medicine'],
            totalStock: number,
            stores: Store[];
        }>);

        return Object.values(groupedByMedicine);
    }

    async createInventory(inventory: InventoryDto) {
        try {
            // register for Inventory
            const createdInv = await this.prisma.inventory.create({
                data: {
                    donationId: inventory.donationId,
                    medicineId: inventory.medicineId,
                    storeId: inventory.storeId,
                    stock: inventory.stock,
                    admissionDate: new Date(inventory.admissionDate),
                    expirationDate: new Date(inventory.expirationDate),
                },
            });

            // register for History 
            await this.prisma.historyInventory.create({
                data: {
                    medicineId: createdInv.medicineId,
                    storeId: createdInv.storeId,
                    donationId: createdInv.donationId,
                    amount: createdInv.stock,
                    type: inventory.type,
                    date: new Date(inventory.date),
                    observations: inventory.observations,
                    admissionDate: createdInv.admissionDate,
                    expirationDate: createdInv.expirationDate,
                },
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



