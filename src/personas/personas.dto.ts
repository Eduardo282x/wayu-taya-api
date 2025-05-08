
import { IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";

export class PersonasDTO{

    @IsNumber()
    id_parroquia: number;
    @IsString()
    nombre: string;
    @IsString()
    apellido: string;
    @IsString()
    direccion: string;
    @IsString()
    email: string;
    @IsString()
    telefono: string;
    @IsString()
    cedula: string;
    @IsString()
    sexo: string;
    @IsDate()
    @Transform(({value}) => new Date(value))
    fecha_nacimiento: Date;
    @IsArray()
    @IsNumber({}, { each: true })
    id_programa: number[];
    @IsBoolean()
    @IsOptional()
    cambioPersona: boolean;
}