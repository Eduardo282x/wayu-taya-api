import { IsArray, IsString } from "class-validator";


export class ReportsDTO {
    
    @IsString()
    provider: string
    
    @IsArray()
    @IsString({ each: true })
    lotes: string[];
}