
import { IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";

export class PersonasDTO{

    @IsNumber()
    id_parroquia: number;
    @IsString()
    name: string;
    @IsString()
    lastName: string;
    @IsString()
    address: string;
    @IsString()
    email: string;
    @IsString()
    phone: string;
    @IsString()
    identification: string;
    @IsString()
    sex: string;
    @IsDate()
    @Transform(({value}) => new Date(value))
    birthdate: Date;
    @IsArray()
    @IsNumber({}, { each: true })
    id_programa: number[];
    @IsBoolean()
    @IsOptional()
    cambioPersona: boolean;
}