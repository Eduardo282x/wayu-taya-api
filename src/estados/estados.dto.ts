import { IsString } from "class-validator";

export class EstadoDTO {
    @IsString()
    estados: string;
}
