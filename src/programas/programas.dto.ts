import { IsNumber, IsString } from "class-validator";

export class ProgramasDTO{
    @IsNumber()
    id_programa: number;
    @IsString()
    programa: string;
    @IsString()
    tipo_programa: string;
}