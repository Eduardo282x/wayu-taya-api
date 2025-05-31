import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { HistoryQueryDto, InventoryDto, InventoryOutDto } from './inventory.dto';

@Controller('inventario')
export class InventoryController {

    constructor(private inventoryService: InventoryService) {
    }

    @Get()
    async getInventory() {
    return await this.inventoryService.getInventory();
    }

    @Get('historial')
    async getHistory(@Query() query: HistoryQueryDto) {
    return await this.inventoryService.getHistory(query);
    }
    
    @Post()
    async createInventory(@Body() inventory: InventoryDto) {
        return await this.inventoryService.createInventory(inventory);
    }

    @Post('salida')
    async removeInventory(@Body() inventory: InventoryOutDto) {
        return await this.inventoryService.removeInventory(inventory);
    }


}


