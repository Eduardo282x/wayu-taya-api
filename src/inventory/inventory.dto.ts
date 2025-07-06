import { Transform, Type } from 'class-transformer';
import { IsInt, Min, IsDate, IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';


export class InventoryDto {
  @IsInt()
  donationId: number;

  @IsString()
  @IsOptional()
  lote?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicinesDto)
  medicines: MedicinesDto[]

  // for history
  @IsString()
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
}

export class InventoryMoveDto {
  
  @IsInt()
  medicineId: number;
  @IsInt()
  sourceStoreId: number;
  @IsInt()
  destinationStoreId: number;
  @IsInt()
  amount: number;

  @IsString()
  lote: string;
}
