import { IsNumber, IsString } from "class-validator";

export class ParroquiasDTO{
    @IsString() 
    parroquias: string;
    @IsNumber()
    id_ciudad: number;
}