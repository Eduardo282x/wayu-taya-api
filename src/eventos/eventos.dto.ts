import { IsArray, IsNumber, IsOptional } from "class-validator";
import { IsString } from "class-validator";
import { IsDateString } from "class-validator";

export class EventosDTO {
    @IsNumber()
    id_parroquia: number;
    @IsString()
    nombre: string;
    @IsString()
    descripcion: string;
    @IsString()
    direccion: string;
    @IsDateString()
    fecha: string;
    @IsArray()
    @IsNumber( {}, { each: true })
    @IsOptional()
    id_proveedores: number[];

}