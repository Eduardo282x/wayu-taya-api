import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { DTOUsuarios, DTOUsuariosPassword } from './usuarios.dto';

@Controller('users')
export class UsuariosController {

    constructor(private readonly usuarioService: UsuariosService) {

    }

    @Get()
    async getUsers() {
        return await this.usuarioService.getUsers();
    }
    @Post()
    async createUser(@Body() username: DTOUsuarios) {
        return await this.usuarioService.createUser(username);
    }
    @Put('/profile/:id')
    async updateProfile(@Param('id') id: string, @Body() username: DTOUsuarios) {
        return await this.usuarioService.updateProfile(Number(id), username);
    }
    @Put('/password/:id')
    async updateUserPassword(@Param('id') id: string, @Body() username: DTOUsuariosPassword) {
        return await this.usuarioService.updateUserPassword(Number(id), username);
    }
    @Put('/:id')
    async updateUser(@Param('id') id: string, @Body() username: DTOUsuarios) {
        return await this.usuarioService.updateUser(Number(id), username);
    }
    @Delete('/:id')
    async deleteUser(@Param('id') id: string) {
        return await this.usuarioService.deleteUser(Number(id));
    }
}
