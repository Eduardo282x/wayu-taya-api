import { IsNumber, IsString } from "class-validator";

export class ParroquiasDTO{
    @IsString() 
    parroquia: string;
    @IsNumber()
    id_ciudad: number;
}