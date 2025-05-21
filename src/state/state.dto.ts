import { IsString } from "class-validator";

export class StateDTO {
    @IsString()
    name: string;
}
