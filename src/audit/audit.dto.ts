import { Transform, Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/** Entrada que recibe `AuditService.record()`. */
export interface AuditEntry {
  action: string;
  entity: string;
  entityId?: number | null;
  description?: string;
  metadata?: Record<string, unknown> | null;
}

export class GetAuditQueryDTO {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  size: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  entity: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  entityId: number;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  from: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  to: Date;
}
