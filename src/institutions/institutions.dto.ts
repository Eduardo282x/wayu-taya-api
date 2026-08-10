import { Type } from 'class-transformer';
import { IsString, ValidateNested, IsArray, IsNumber, IsOptional } from 'class-validator';

export class InstitutionsDTO {
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  rif: string;
  @IsString()
  address: string;
  @IsString()
  country: string;
  @IsString()
  @IsOptional()
  email: string;
  @IsString()
  type: string;
  @IsNumber()
  @IsOptional()
  parishId: number;
}
export class InstitutionsManyDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstitutionsDTO)
  institutions: InstitutionsDTO[];
}
