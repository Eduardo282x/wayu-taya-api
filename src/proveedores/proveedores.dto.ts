import { IsString } from "class-validator";

export class ProveedoresDTO {
    @IsString()
    name: string;
    @IsString()
    rif: string;
    @IsString()
    address: string;
    @IsString()
    country: string;
    @IsString()
    email: string;
}