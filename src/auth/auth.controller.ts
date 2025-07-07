import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DTOLogin, DTORecoverPassword } from './auth.dto';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) {

    }

    @Post()
    async authLogin(@Body() login: DTOLogin) {
        return await this.authService.authLogin(login);
    }

    @Post('/recover')
    async changePassword(@Body() change: DTORecoverPassword) {
        return await this.authService.changePassword(change);
    }
}
