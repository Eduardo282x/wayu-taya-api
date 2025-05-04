import { IsString, IsDateString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class DocumentoDTO {
  @IsString()
  nombre_documento: string;

  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsNumber()
  parroquiasId_parroquia?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  id_personas?: number[];
}