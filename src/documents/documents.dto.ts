import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsNumber, IsArray, IsDate } from 'class-validator';

export class DocumentDTO {
  @IsString()
  name: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  date: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  peopleId?: number[];

  // for file upload

  @IsOptional()
  @IsString()
  filePath?: string;
  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}


export class NewDocumentDTO {
  @IsString()
  name: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  date: Date;

  @IsString()
  type: string;
  @IsString()
  description: string;
  @IsString()
  content: string;

}