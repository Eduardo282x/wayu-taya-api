import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsNumber, IsArray, IsDate } from 'class-validator';

export class DocumentDTO {
  @IsString()
  name: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  date: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  peopleId?: number[];
}