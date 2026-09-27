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
import { Transform, Type } from 'class-transformer';
import { LocationDTO } from '../common/dto/location.dto';

export class PeopleDTO {
  @IsDefined()
  @ValidateNested()
  @Type(() => LocationDTO)
  location: LocationDTO;
  @IsString()
  name: string;
  @IsString()
  lastName: string;
  @IsString()
  address: string;
  @IsString()
  email: string;
  @IsString()
  phone: string;
  @IsString()
  identification: string;
  @IsString()
  sex: string;
  @IsDate()
  @Transform(({ value }) => new Date(value))
  birthdate: Date;
}

export class PersonProgramDTO extends PeopleDTO {
  @IsArray()
  @IsNumber({}, { each: true })
  id_programa: number[];
  @IsBoolean()
  @IsOptional()
  cambioPersona: boolean;
}
