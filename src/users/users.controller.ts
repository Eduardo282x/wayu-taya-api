import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDTO, UserPasswordDTO } from './users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get()
  async getUsers() {
    return await this.userService.getUsers();
  }
  @Get('/roles')
  async getRoles() {
    return await this.userService.getRoles();
  }
  @Post()
  async createUser(@Body() user: UserDTO) {
    return await this.userService.createUser(user);
  }
  @Put('/profile/:id')
  async updateProfile(@Param('id') id: string, @Body() user: UserDTO) {
    return await this.userService.updateProfile(Number(id), user);
  }
  @Put('/password/:id')
  async updateUserPassword(
    @Param('id') id: string,
    @Body() user: UserPasswordDTO,
  ) {
    return await this.userService.updateUserPassword(Number(id), user);
  }
  @Put('/:id')
  async updateUser(@Param('id') id: string, @Body() user: UserDTO) {
    return await this.userService.updateUser(Number(id), user);
  }
  @Delete('/:id')
  async deleteUser(@Param('id') id: string) {
    return await this.userService.deleteUser(Number(id));
  }
}
