import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class StoreDTO {
  @IsString()
  name: string;
  @IsString()
  address: string;
  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;
}
