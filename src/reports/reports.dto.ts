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