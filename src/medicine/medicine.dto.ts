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
    name: string;
    description: string;
    categoryId: string;
    medicine: boolean;
    unit: string;
    amount: number;
    temperate: string;
    manufacturer: string;
    activeIngredient: string;
    countryOfOrigin:  string;
    forms:            string;
    benefited:        number;
}

export class CategoryDTO {
    @IsString()
    category: string

}
export class FormsDTO {
    @IsString()
    forms: string
}
