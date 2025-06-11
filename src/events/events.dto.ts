import { Transform } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsString } from "class-validator";

export class EventsDTO {
    @IsNumber()
    parishId: number;

    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsString()
    address: string;
    
    @IsDate()
    @Transform(({ value }) => new Date(value))
    startDate: Date;

    @IsDate()
    @Transform(({ value }) => new Date(value))
    endDate: Date;

    @IsArray()
    @IsNumber({}, { each: true })
    providersId: number[];

    @IsOptional()
    @IsBoolean()
    cambio_proveedores: boolean;
}