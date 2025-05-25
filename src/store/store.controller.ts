import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreDTO } from './store.dto';

@Controller('store')
export class StoreController {

    constructor(private storeService: StoreService){

    }
    @Get()
    async getStore(){
        return await this.storeService.getStore()
    }
    @Post()
    async createStore(@Body() store: StoreDTO ){
        return await this.storeService.createStore(store);
    }
    @Put('/:id')
    async updateStore(@Param('id') id: string, @Body() store: StoreDTO){
        return await this.storeService.updateStore(Number(id), store);
    }
    @Delete('/:id')
    async deleteStore(@Param('id') id: string) {
        return await this.storeService.deleteStore(Number(id));
    }

}
