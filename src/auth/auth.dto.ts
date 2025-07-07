import { IsString } from "class-validator";

export class DTOLogin {
    @IsString()
    username: string;
    @IsString()
    password: string;
}
export class DTORecoverPassword {
    @IsString()
    email: string;
    @IsString()
    password: string;
}