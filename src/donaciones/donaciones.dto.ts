import { Transform, Type } from "class-transformer";
import { IsArray, IsDate, ValidateNested, IsNumber, IsOptional, IsString, IsBoolean } from "class-validator";

export class DonationsDTO {
    @IsNumber()
    @IsOptional()
    peopleId: number;
    @IsNumber()
    @IsOptional()
    providerId: number;
    @IsString()
    type: string;
    @IsDate()
    @Transform(({ value }) => new Date(value))
    date: Date;
    @IsString()
    lote: string;

    @IsOptional()
    @IsBoolean()
    changeDonDetails: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DetDonationDTO)
    medicines: DetDonationDTO[];
}

export class DetDonationDTO {
    @IsNumber()
    medicineId: number;
    @IsNumber()
    amount: number;
}

