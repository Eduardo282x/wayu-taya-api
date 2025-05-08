import { IsNumber, IsString } from "class-validator";

export class ProgramasDTO{
   
    @IsString()
    programa: string;
    @IsString()
    tipo_programa: string;
}