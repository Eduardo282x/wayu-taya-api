import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ReportsDTO {
  @IsString()
  provider: string;
  @IsArray()
  @IsString({ each: true })
  lotes: string[];

  // Filtros opcionales: acotan el subconjunto exportado.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  providerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  storeId?: number;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  from?: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  to?: Date;
}

export class SummaryReportDto {
  @IsDate()
  @Transform(({ value }) => new Date(value))
  from: Date;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  to: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  providerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  storeId?: number;

  @IsOptional()
  @IsString()
  lote?: string;
}

export interface DonationSummary {
  id: number;
  date: Date;
  description?: string;
  details: {
    product: string;
    quantity: number;
  }[];
}

export interface ProductSummary {
  product: string;
  amount: number;
  percentage: number;
}

export interface StoreSummary {
  storage: string;
  totalProducts: number;
  capacity: number;
  usedCapacity: number;
  availableCapacity: number;
  capacityPercentage: number;
}

export interface SummaryReportResponse {
  donations: DonationSummary[];
  productMostDonated: ProductSummary[];
  productByStorage: StoreSummary[];
  totalInventory: number;
  lotes: { lotes: string[] };
  providers: { provider: string; id: number }[];
  period: {
    from: string;
    to: string;
  };
}

export interface IInventory {
  id: number;
  medicine: IMedicine;
  totalStock: number;
  stores: Store[];
  datesMedicine: DatesMedicine[];
  lotes: ILotes[];
}

export interface ILotes {
  name: string;
  storeId: number;
  medicineId: number;
  expirationDate: Date;
  admissionDate: Date;
}

export interface DatesMedicine {
  admissionDate: Date;
  expirationDate: Date;
}

export interface Store {
  id: number;
  name: string;
  address: string;
  amount: number;
  capacity: number;
  usedCapacity: number;
  availableCapacity: number;
  capacityPercentage: number;
}

export interface IMedicine {
  id: number;
  name: string;
  description: string;
  code: string | null;
  categoryId: number;
  medicine: boolean;
  temperate: string;
  presentation: string;
  manufacturer: string;
  activeIngredient: string;
  countryOfOrigin: string;
  formId: number;
  category: ICategory;
  form: IForm;
}

export interface ICategory {
  id: number;
  category: string;
}

export interface IForm {
  id: number;
  forms: string;
}
