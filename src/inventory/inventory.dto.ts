import { Transform, Type } from 'class-transformer';
import { IsInt, Min, IsDate, IsOptional, IsString, IsNotEmpty, ValidateNested, IsArray } from 'class-validator';


export class InventoryDto {
  @IsInt()
  donationId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicinesDto)
  medicines: MedicinesDto[]

  // for history
  @IsString()
  @IsNotEmpty()
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
  @Min(0)
  stock: number;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  admissionDate: Date;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  expirationDate: Date;
}

export class HistoryQueryDto {
  @IsDate()
  @Transform(({ value }) => new Date(value))
  from: Date;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  to: Date;
}


