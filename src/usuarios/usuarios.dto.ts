import { IsEmail, IsString } from "class-validator";

export class DTOUsuarios {
    @IsString()
    usuario: string;
    @IsString()
    nombre: string;
    @IsString()
    apellido: string;
    @IsString()
    @IsEmail()
    correo: string;
}