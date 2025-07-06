import { Controller, Get, Post, Body, Query, Put } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { HistoryQueryDto, InventoryDto, InventoryMoveDto } from './inventory.dto';

@Controller('inventory')
export class InventoryController {

    constructor(private inventoryService: InventoryService) {
    }

    @Get()
    async getInventory() {
    return await this.inventoryService.getInventory();
    }

    @Get('/historial')
    async getHistory(@Query() query: HistoryQueryDto) {
    return await this.inventoryService.getHistory(query);
    }
    
    @Post()
    async processInventory(@Body() inventory: InventoryDto) {
        return await this.inventoryService.processInventory(inventory);
    }
/*
    @Post()
    async createInventory(@Body() inventory: InventoryDto) {
        return await this.inventoryService.createInventory(inventory);
    }
    @Post('/salida')
    async removeInventory(@Body() inventory: InventoryDto) {
        return await this.inventoryService.removeInventory(inventory);
    }*/

    @Put('/menealo')
    async transferMedicineBetweenStores(@Body() param: InventoryMoveDto) {
        return await this.inventoryService.transferMedicineBetweenStores(param);
    }
}


