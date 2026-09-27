import { Type } from 'class-transformer';
import {
  IsDefined,
  IsString,
  ValidateNested,
  IsArray,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { LocationDTO } from '../common/dto/location.dto';

export class InstitutionsDTO {
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  rif: string;
  @IsString()
  address: string;
  @IsString()
  responsible: string;
  @IsString()
  phone: string;
  @IsString()
  country: string;
  @IsString()
  @IsOptional()
  email: string;
  @IsString()
  type: string;
  @IsDefined()
  @ValidateNested()
  @Type(() => LocationDTO)
  location: LocationDTO;
}
export class InstitutionsManyDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstitutionsDTO)
  institutions: InstitutionsDTO[];
}

export class GetInstitutionsQueryDTO {
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
