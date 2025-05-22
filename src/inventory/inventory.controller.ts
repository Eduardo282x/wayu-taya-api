import { Controller, Get, Post, Body } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryDto } from './inventory.dto';

@Controller('inventario')
export class InventoryController {

    constructor(private inventoryService: InventoryService) {
    }

    @Get()
    async getInventory() {
    return await this.inventoryService.getInventory();
    }
    
    @Post()
    async createInventory(@Body() inventory: InventoryDto) {
        return await this.inventoryService.createInventory(inventory);
    }


}


