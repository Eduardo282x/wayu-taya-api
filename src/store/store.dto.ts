import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class StoreDTO {
  @IsString()
  @MaxLength(120)
  name: string;
  @IsString()
  @MaxLength(255)
  address: string;
  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;
}
