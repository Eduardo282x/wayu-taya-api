import { Body, Controller, Delete, Get, Param, Post, Put} from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';
import { ProveedoresDTO } from './proveedores.dto';

@Controller('proveedores')
export class ProveedoresController {

    constructor (private proveedoresService: ProveedoresService){}

    @Get()
    async getProveedores() {
        return await this.proveedoresService.getProveedores();
    }

    @Post()
    async createProveedor(@Body() datos: ProveedoresDTO) {
        return await this.proveedoresService.createProveedores(datos);
    }

    @Put('/:id')
    async updateProveedor(@Param('id') id_proveedor:string, @Body() datos: ProveedoresDTO) {
        return await this.proveedoresService.updateProveedores(Number(id_proveedor),datos);
    }

    @Delete('/:id')
    async deleteProveedores(@Param('id') id_proveedor: string) {
        return await this.proveedoresService.deleteProveedores(Number(id_proveedor));
    }
}
