import { IsString, IsNumber } from 'class-validator';

export class TownDTO {
    @IsString()
    town: string;
    @IsNumber()
    id_municipio: number;
}
