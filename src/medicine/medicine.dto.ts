import { IsBoolean, IsNumber, IsOptional, isString, IsString } from "class-validator";

export class MedicineDTO {
    @IsString()
    name: string;
    @IsString()
    description: string;
    @IsNumber()
    categoryId: number;
    @IsBoolean()
    medicine: boolean;

    @IsOptional()
    @IsString()
    @IsOptional()
    unit: string;

    @IsOptional()
    @IsNumber()
    amount: number;

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

    @IsOptional()
    @IsNumber()
    formId: number;

    @IsOptional()
    @IsNumber()
    benefited: number;
}

export interface MedicineFormatExcel {
    Nombre: string;
    Descripcion: string;
    Categoria: string;
    Medicina: string;
    Unidad: string;
    Cantidad: number;
    Temperatura: string;
    Manofacturador: string;
    Principio_Activo: string;
    Pais_Origen:  string;
    Forma:            string;
    Beneficiado:        number;
}

export class CategoryDTO {
    @IsString()
    category: string

}
export class FormsDTO {
    @IsString()
    forms: string
}
