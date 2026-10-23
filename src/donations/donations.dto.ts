import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  ValidateNested,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsIn,
  Min,
  Max,
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
  @IsDate({ message: 'La fecha de la donación no es válida.' })
  @Transform(({ value }) =>
    value == null || value === '' ? value : new Date(value),
  )
  date: Date;
  @IsString()
  @IsNotEmpty({ message: 'El número de control es obligatorio.' })
  controlNumber: string;
  @IsString()
  @IsNotEmpty({ message: 'El lote es obligatorio.' })
  lote: string;

  @IsOptional()
  @IsBoolean()
  changeDonDetails: boolean;

  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos una medicina.' })
  @ArrayMaxSize(500, {
    message: 'Una donación no puede superar las 500 medicinas.',
  })
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
  @Max(500)
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
  @IsInt()
  @Min(1)
  medicineId: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => MedicineMinDTO)
  medicine: MedicineMinDTO;

  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad debe ser mayor a 0.' })
  amount: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  benefited: number;

  @IsInt({ message: 'El almacén es obligatorio.' })
  @Min(1, { message: 'El almacén es obligatorio.' })
  storageId: number;

  @IsOptional()
  @IsString()
  lote: string;

  @IsDate({ message: 'La fecha de vencimiento no es válida.' })
  @Transform(({ value }) =>
    value == null || value === '' ? value : new Date(value),
  )
  expirationDate: Date;
}
