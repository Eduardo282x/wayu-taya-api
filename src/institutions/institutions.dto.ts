import { IsString } from "class-validator";

export class InstitutionsDTO {
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