import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { ProfileDTO, UserDTO, UserPasswordDTO } from './users.dto';
import { Roles } from 'src/auth/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'src/auth/auth.types';

/**
 * Gestión de cuentas = Administradores únicamente.
 * Antes no había ninguna comprobación: cualquier usuario autenticado podía
 * llamar a PUT /users/:id con rolId=1 y GRANTearse Super Admin.
 *
 * ORDEN DE LAS RUTAS (importante):
 * Express las registra en el orden en que aparecen los métodos, y gana la
 * primera que coincide. `/:id` se declara DESPUÉS de `/me` y `/password/:id`
 * a proposito: si `/:id` fuera primero, `PUT /users/me` caería en
 * `ParseIntPipe` con el valor "me" y devolvería 400.
 */
@Roles('Super Admin', 'Administrador')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  // ─────────────── Rutas estáticas: deben declararse antes que /:id ───────────────

  @Get('/roles')
  async getRoles() {
    return this.userService.getRoles();
  }

  /**
   * Perfil propio: abierto a cualquier usuario autenticado, pero el id se
   * toma del JWT, NUNCA de un parámetro de ruta.
   */
  @Roles('Super Admin', 'Administrador', 'Usuarios')
  @Get('/me')
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.userService.findById(user.sub);
  }

  @Roles('Super Admin', 'Administrador', 'Usuarios')
  @Put('/me')
  async updateMe(@CurrentUser() user: JwtPayload, @Body() dto: ProfileDTO) {
    return this.userService.updateProfile(user.sub, dto);
  }

  @Put('/password/:id')
  async updateUserPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UserPasswordDTO,
  ) {
    return this.userService.updateUserPassword(id, dto);
  }

  // ─────────────────────────── Rutas con parámetro ───────────────────────────

  @Get()
  async getUsers() {
    return this.userService.getUsers();
  }

  @Post()
  async createUser(@Body() dto: UserDTO) {
    return this.userService.createUser(dto);
  }

  @Put('/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UserDTO,
  ) {
    return this.userService.updateUser(id, dto);
  }

  @Delete('/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteUser(id);
  }
}
