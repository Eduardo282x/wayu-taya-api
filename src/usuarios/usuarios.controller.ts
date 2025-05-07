import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { DTOUsuarios } from './usuarios.dto';

@Controller('usuarios')
export class UsuariosController {

    constructor(private readonly usuarioService: UsuariosService) {

    }

    @Get()
    async getUsers() {
        return await this.usuarioService.getUsers();
    }
    @Post()
    async createUser(@Body() usuario: DTOUsuarios) {
        return await this.usuarioService.createUser(usuario);
    }
    @Put('/:id')
    async updateUser(@Param('id') id: string, @Body() usuario: DTOUsuarios) {
        return await this.usuarioService.updateUser(Number(id), usuario);
    }
    @Delete('/:id')
    async deleteUser(@Param('id') id: string) {
        return await this.usuarioService.deleteUser(Number(id));
    }
}
