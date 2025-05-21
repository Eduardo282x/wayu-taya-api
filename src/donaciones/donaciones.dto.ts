import { Transform } from "class-transformer";
import { IsArray, IsDate, ValidateNested, IsNumber, IsOptional, IsString } from "class-validator";

export class DonacionesDTO {
    @IsNumber()
    peopleId: number;
    @IsOptional()
    @IsArray()
    providerId: number;
    @IsString()
    type: string;
    @IsDate()
    @Transform(({ value }) => new Date(value))
    date: Date;
    @IsString()
    lote: string;

    @IsArray()
    @ValidateNested({ each: true })
    medicines: DetDonacionDTO[]=[];
}

export class DetDonacionDTO {
    @IsNumber()
    medicineId: number;
    @IsNumber()
    amount: number;
}

