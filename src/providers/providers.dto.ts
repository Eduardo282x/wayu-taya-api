import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ProviderDTO {
  @IsString()
  name: string;
  @IsString()
  rif: string;
  @IsString()
  address: string;
  @IsString()
  country: string;
  @IsString()
  email: string;
  @IsString()
  responsible: string;
  @IsString()
  phone: string;
}

export class GetProvidersQueryDTO {
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
}
