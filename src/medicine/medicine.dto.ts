import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class MedicineDTO{
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
    @IsNumber()
    formId: number;
}
