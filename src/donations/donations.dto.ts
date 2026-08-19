import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';

export class DonationsDTO {
  @IsOptional()
  @IsNumber()
  institutionId: number;
  @IsOptional()
  @IsNumber()
  providerId: number;
  @IsString()
  type: string;
  @IsDate()
  @Transform(({ value }) => new Date(value))
  date: Date;
  @IsString()
  lote: string;

  @IsOptional()
  @IsNumber()
  benefited: number;

  @IsOptional()
  @IsBoolean()
  changeDonDetails: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetDonationDTO)
  medicines: DetDonationDTO[];
}

export class MedicineMinDTO {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  category: string;

  @IsOptional()
  @IsBoolean()
  medicine: boolean;

  @IsOptional()
  @IsString()
  form: string;

  @IsOptional()
  @IsString()
  presentation: string;

  @IsOptional()
  @IsString()
  temperate: string;

  @IsOptional()
  @IsString()
  manufacturer: string;

  @IsOptional()
  @IsString()
  activeIngredient: string;

  @IsOptional()
  @IsString()
  countryOfOrigin: string;
}

export class DetDonationDTO {
  @IsOptional()
  @IsNumber()
  medicineId: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => MedicineMinDTO)
  medicine: MedicineMinDTO;

  @IsNumber()
  amount: number;
  @IsOptional()
  @IsNumber()
  benefited: number;
  @IsNumber()
  storageId: number;
  @IsOptional()
  @IsString()
  lote: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  expirationDate: Date;
}
