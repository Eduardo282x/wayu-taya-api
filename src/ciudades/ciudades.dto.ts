import { IsString, IsNumber } from 'class-validator';

export class CiudadDTO {
    @IsString()
    ciudad: string;
    @IsNumber()
    id_municipio: number;
}
