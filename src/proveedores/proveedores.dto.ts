import { IsString } from "class-validator";

export class ProveedoresDTO {
    @IsString()
    nombre: string;
    @IsString()
    rif: string;
    @IsString()
    direccion: string;
    @IsString()
    pais: string;
    @IsString()
    correo: string;
}