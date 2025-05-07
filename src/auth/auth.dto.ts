import { IsString } from "class-validator";

export class DTOLogin {
    @IsString()
    username: string;
    @IsString()
    password: string;
}