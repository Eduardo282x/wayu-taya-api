import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class MedicineDTO {
  @IsString()
  name: string;
  @IsString()
  description: string;
  @IsOptional()
  @IsString()
  code: string;

  @IsString()
  category: string;
  @IsBoolean()
  medicine: boolean;

  @IsOptional()
  @IsString()
  form: string;

  @IsOptional()
  @IsString()
  provider: string;

  @IsOptional()
  @IsString()
  presentation: string;

  @IsOptional()
  @IsString()
  temperate: string;

  @IsOptional()
  @IsString()
  manufacturer: string;

  @IsOptional()
  @IsString()
  activeIngredient: string;

  @IsOptional()
  @IsString()
  countryOfOrigin: string;
}

export class GetMedicineQueryDTO {
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

  @IsOptional()
  @IsString()
  name: string;
}

export interface MedicineFormatExcel {
  Nombre: string;
  Descripcion: string;
  Categoria: string;
  Medicina: string;
  Codigo: string;
  Presentacion: string;
  Temperatura: string;
  Fabricante: string;
  Principio_Activo: string;
  Pais_Origen: string;
  Forma: string;
}

export class CategoryDTO {
  @IsString()
  category: string;
}
export class FormsDTO {
  @IsString()
  forms: string;
}
