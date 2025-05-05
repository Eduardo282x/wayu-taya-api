import { Transform } from 'class-transformer';
import { IsString, IsDateString, IsOptional, IsNumber, IsArray, IsDate } from 'class-validator';

export class DocumentoDTO {
  @IsString()
  nombre_documento: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  fecha: string;

  @IsOptional()
  @IsNumber()
  parroquiasId_parroquia?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  id_personas?: number[];
}