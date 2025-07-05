import { Type } from "class-transformer";
import { IsString, ValidateNested, IsArray, IsNumber } from "class-validator";

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
    @IsString()
    type: string;
    @IsNumber()
    parishId: number;
}
export class InstitutionsManyDTO {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InstitutionsDTO)
    institutions: InstitutionsDTO[];
}