import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { AlmacenService } from './almacen.service';
import { AlmacenDTO } from './almacen.dto';

@Controller('almacen')
export class AlmacenController {

    constructor(private almacenService: AlmacenService){

    }

    @Get()
    async getStore(){
        return await this.almacenService.getStore()
    }
    @Post()
    async createStore(@Body() almacen: AlmacenDTO ){
        return await this.almacenService.createStore(almacen);
    }
    @Put('/:id')
    async updateStore(@Param('id') id: string, @Body() almacen: AlmacenDTO){
        return await this.almacenService.updateStore(Number(id), almacen);
    }
    @Delete('/:id')
    async deleteUser(@Param('id') id: string) {
        return await this.almacenService.deleteStore(Number(id));
    }

}
