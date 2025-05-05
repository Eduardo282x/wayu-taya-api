import { Transform } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsString } from "class-validator";

export class EventosDTO {
    @IsNumber()
    id_parroquia: number;
    @IsString()
    nombre: string;
    @IsString()
    descripcion: string;
    @IsString()
    direccion: string;
    @IsDate()
    @Transform(({ value }) => new Date(value))
    fecha: Date;
    @IsArray()
    @IsNumber({}, { each: true })
    id_proveedores: number[];
    @IsOptional()
    @IsBoolean()
    cambio_proveedores: boolean;
}