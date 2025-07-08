import { IsArray, IsDateString, IsNotEmpty, IsString } from "class-validator";


export class ReportsDTO {
    
    @IsString()
    provider: string
    
    @IsArray()
    @IsString({ each: true })
    lotes: string[];
}

export class SummaryReportDto {
    @IsDateString()
    @IsNotEmpty()
    from: string;
  
    @IsDateString()
    @IsNotEmpty()
    to: string;
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
    nombreDelProducto: string;
    cantidadDonada: number;
    porcentajeRespectoAlTotalDeSalidas: number;
  }
  
  export interface StoreSummary {
    nombreAlmacen: string;
    totalProductos: number;
  }
  
  export interface SummaryReportResponse {
    donaciones: DonationSummary[];
    productosMasDonados: ProductSummary[];
    productosPorAlmacen: StoreSummary[];
    totalGlobalInventario: number;
    periodo: {
      desde: string;
      hasta: string;
    };
  }