import { Transform } from "class-transformer";
import { IsArray, IsDate, IsDateString, IsNotEmpty, IsString } from "class-validator";


export class ReportsDTO {
  @IsString()
  provider: string
  @IsArray()
  @IsString({ each: true })
  lotes: string[];
}

export class SummaryReportDto {
  @IsDate()
  @Transform(({ value }) => new Date(value))
  from: Date;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  to: Date;
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
}

export interface SummaryReportResponse {
  donations: DonationSummary[];
  productMostDonated: ProductSummary[];
  productByStorage: StoreSummary[];
  totalInventory: number;
  lotes: string[];
  providers: { provider: string, id: number }[];
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
}


export interface IMedicine {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  medicine: boolean;
  unit: string;
  amount: number;
  temperate: string;
  manufacturer: string;
  activeIngredient: string;
  countryOfOrigin: string;
  formId: number;
  category: ICategory;
  form: IForm;
  benefited: number;
}

export interface ICategory {
  id: number;
  category: string;
}

export interface IForm {
  id: number;
  forms: string;
}
