import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class MedicineDTO {
  @IsString()
  name: string;
  @IsString()
  description: string;
  @IsString()
  code: string;
  @IsString()
  lote: string;

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
  @Max(500)
  size: number;

  @IsOptional()
  @IsString()
  name: string;
}

export interface MedicineFormatExcel {
  Codigo: string;
  Nombre: string;
  Presentacion: string;
  Forma: string;
  Categoria: string;
  Medicina: string;
  'Lote (base)': string;
  Temperatura: string;
  Fabricante: string;
  Proveedor: string;
  'Principio Activo': string;
  'Pais Origen': string;
  Descripcion: string;
}

export class CategoryDTO {
  @IsString()
  category: string;
}
export class FormsDTO {
  @IsString()
  forms: string;
}
