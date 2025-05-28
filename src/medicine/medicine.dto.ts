<<<<<<< HEAD:src/medicina/medicina.dto.ts
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString } from "class-validator";
=======
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
>>>>>>> 4ea71d267badf7dcbe6af4b5b0b705423a9604cf:src/medicine/medicine.dto.ts

export class MedicineDTO{
    @IsString()
    name: string;
    @IsString()
    description: string;
    @IsNumber()
    categoryId: number;
    @IsBoolean()
    medicine: boolean;
    
<<<<<<< HEAD:src/medicina/medicina.dto.ts
=======
    @IsOptional()
>>>>>>> 4ea71d267badf7dcbe6af4b5b0b705423a9604cf:src/medicine/medicine.dto.ts
    @IsString()
    @IsOptional()
    unit: string;
<<<<<<< HEAD:src/medicina/medicina.dto.ts
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
=======

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

>>>>>>> 4ea71d267badf7dcbe6af4b5b0b705423a9604cf:src/medicine/medicine.dto.ts
    @IsOptional()
    @IsNumber()
    formId: number;
}
