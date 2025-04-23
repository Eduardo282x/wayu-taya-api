import { IsNumber } from "class-validator";
import { IsString } from "class-validator";

export class MunicipioDTO {
    @IsNumber()
    id_estado: number;
    @IsString()
    municipio: string;
}
