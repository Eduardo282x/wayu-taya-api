import { IsBoolean, IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class MedicinaDTO{
    @IsString()
    name: string;
    @IsString()
    description: string;
    @IsNumber()
    categoryId: number;
    @IsBoolean()
    medicine: boolean;
    
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