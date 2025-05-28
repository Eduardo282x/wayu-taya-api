import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { HistoryQueryDto, InventoryDto } from './inventory.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

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
                donationId: item.donationId,
                donation: item.donation,
                storeId: item.store.id,
                storeName: item.store.name,
                stock: item.stock,
                admissionDate: item.admissionDate,
                expirationDate: item.expirationDate,
            });

            return accu;
        }, {} as Record<number, {
            medicine: typeof inventory[number]['medicine'],
            totalStock: number,
            stores: {
                donationId: number;
                donation: typeof inventory[number]['donation'];
                storeId: number;
                storeName: string;
                stock: number;
                admissionDate: Date;
                expirationDate: Date;
            }[];
        }>);

        return Object.values(groupedByMedicine);
    }

    async createInventory(inventory: InventoryDto) {
        try {
            // register for Inventory
            const createdinv = await this.prisma.inventory.create({
                data: {
                donationId:     inventory.donationId,
                medicineId:     inventory.medicineId,
                storeId:        inventory.storeId,
                stock:          inventory.stock,
                admissionDate:  new Date(inventory.admissionDate),
                expirationDate: new Date(inventory.expirationDate),
                },
            });

            // register for History 
            await this.prisma.historyInventory.create({
                data: {
                medicineId:     createdinv.medicineId,
                storeId:        createdinv.storeId,
                donationId:     createdinv.donationId,
                amount:         createdinv.stock,
                type:           inventory.type,
                date:           new Date(inventory.date),
                observations:   inventory.observations,
                admissionDate:  createdinv.admissionDate, 
                expirationDate: createdinv.expirationDate,
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
}

}

    

