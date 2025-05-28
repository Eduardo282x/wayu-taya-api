import { Transform } from 'class-transformer';
import { IsInt, Min, IsDate, IsOptional, IsString, IsNotEmpty } from 'class-validator';


export class InventoryDto {
  @IsInt()
  donationId: number;

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

export class HistoryQueryDto {
  @IsDate()
  @Transform(({ value }) => new Date(value))
  from: Date;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  to: Date;
}


