import { IsString } from "class-validator";

export class AlmacenDTO{
    @IsString()
    name: string
    @IsString()
    address: string

}