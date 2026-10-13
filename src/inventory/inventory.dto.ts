import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  Min,
  Max,
  IsDate,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
  IsNumber,
  IsIn,
} from 'class-validator';

export class InventoryDto {
  @IsInt()
  donationId: number;

  @IsString()
  @IsOptional()
  lote?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicinesDto)
  medicines: MedicinesDto[];

  // for history
  @IsString()
  @IsIn(['Entrada', 'Salida'])
  type: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  date: Date;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class MedicinesDto {
  @IsInt()
  medicineId: number;

  @IsInt()
  storeId: number;

  @IsOptional()
  @IsString()
  lote: string;

  @IsInt()
  @Min(1)
  stock: number;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  admissionDate: Date;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  expirationDate: Date;
}

export class HistoryQueryDto {
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  from: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  to: Date;

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
}

export class GetInventoryQueryDto {
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
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  storeId: number;
}

export class InventoryMoveDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetailInventoryMoveDto)
  movements: DetailInventoryMoveDto[];
}

export class DetailInventoryMoveDto {
  @IsNumber()
  medicineId: number;
  @IsNumber()
  sourceStoreId: number;
  @IsNumber()
  quantity: number;
  @IsNumber()
  targetStoreId: number;
}

export class InventoryOutDTO {
  @IsNumber()
  medicineId: number;
  @IsNumber()
  storeId: number;
  @IsOptional()
  @IsString()
  lote?: string;
  @IsNumber()
  amount: number;
  @IsString()
  observations: string;
}

export class AlertsQueryDto {
  /** Ventana de días hacia delante para lotes por vencer. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  days: number;

  /** Umbral de stock mínimo (agregado por medicina/almacén). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStock: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  storeId: number;
}
