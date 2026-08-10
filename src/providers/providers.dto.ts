import { IsString } from 'class-validator';

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
