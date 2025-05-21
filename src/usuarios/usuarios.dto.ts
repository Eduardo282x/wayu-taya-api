import { IsEmail, IsString } from "class-validator";

export class DTOUsuarios {
    @IsString()
    username: string;
    @IsString()
    name: string;
    @IsString()
    lastName: string;
    @IsString()
    @IsEmail()
    correo: string;
}