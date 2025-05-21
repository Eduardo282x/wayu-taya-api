import { IsBoolean, IsInt, IsNumber, IsString } from "class-validator";

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
    unit: string;
    @IsNumber()
    amount: number;
    @IsString()
    temperate: string;
    @IsString()
    manufacturer: string;
    @IsString()
    activeIngredient: string;
    @IsNumber()
    formId: number;
}