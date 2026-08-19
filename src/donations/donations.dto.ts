import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsIn,
  Min,
} from 'class-validator';

export class DonationsDTO {
  @IsOptional()
  @IsNumber()
  institutionId: number;
  @IsOptional()
  @IsNumber()
  providerId: number;
  @IsString()
  @IsIn(['Entrada', 'Salida'])
  type: string;
  @IsDate()
  @Transform(({ value }) => new Date(value))
  date: Date;
  @IsString()
  controlNumber: string;
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

export class GetDonationsQueryDTO {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  size: number;

  @IsOptional()
  @IsString()
  lote: string;

  @IsOptional()
  @IsString()
  controlNumber: string;

  @IsOptional()
  @IsString()
  @IsIn(['Entrada', 'Salida'])
  type: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  providerId: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  institutionId: number;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  endDate: Date;
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
  @Min(0)
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
