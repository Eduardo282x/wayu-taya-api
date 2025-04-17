import { IsNumber } from "class-validator";
import { IsString } from "class-validator";

export class MunicDTO {
    @IsNumber()
    id_estado: number;
    @IsString()
    municipios: string;
    
}
