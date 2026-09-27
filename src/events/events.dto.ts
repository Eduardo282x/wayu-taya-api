import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsDefined,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { LocationDTO } from '../common/dto/location.dto';

export class EventsDTO {
  @IsDefined()
  @ValidateNested()
  @Type(() => LocationDTO)
  location: LocationDTO;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  address: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  endDate: Date;

  @IsArray()
  @IsNumber({}, { each: true })
  providersId: number[];

  @IsOptional()
  @IsBoolean()
  cambio_proveedores: boolean;
}
