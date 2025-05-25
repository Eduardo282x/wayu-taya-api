import { IsString } from "class-validator";

export class StoreDTO{
    @IsString()
    name: string
    @IsString()
    address: string

}