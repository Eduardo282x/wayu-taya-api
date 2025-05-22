import { Transform } from 'class-transformer';
import { IsInt, Min, IsDate } from 'class-validator';


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

}

