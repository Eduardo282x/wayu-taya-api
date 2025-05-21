import { IsString } from "class-validator";

export class ProgramsDTO{
    @IsString()
    program: string;
    @IsString()
    type: string;
}