import { IsString } from "class-validator";

export class EstadoDTO {
    @IsString()
    estado: string;
}
