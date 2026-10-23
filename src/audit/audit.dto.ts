import { Transform, Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/** Referencia legible a la donación afectada por una entrada de auditoría. */
export interface AuditDonationRef {
  id: number;
  controlNumber?: string | null;
  type?: string | null;
  date?: Date | string | null;
  lote?: string | null;
}

/** Referencia legible a la medicina afectada. */
export interface AuditMedicineRef {
  id: number;
  name?: string | null;
  code?: string | null;
}

/** Referencia legible al almacén afectado. */
export interface AuditStoreRef {
  id: number;
  name?: string | null;
}

/**
 * Snapshot legible de las entidades relacionadas. Se guarda en el momento de
 * la acción para que el log sea autocontenido: las filas originales pueden
 * borrarse (p. ej. DetDonation/Inventory) o cambiar después.
 */
export interface AuditRefs {
  donation?: AuditDonationRef;
  medicine?: AuditMedicineRef;
  store?: AuditStoreRef;
  targetStore?: AuditStoreRef;
  institution?: { id: number; name?: string | null };
  provider?: { id: number; name?: string | null };
}

/** Metadata de una entrada de auditoría. */
export interface AuditMetadata extends Record<string, unknown> {
  before?: unknown;
  after?: unknown;
  payload?: unknown;
  refs?: AuditRefs;
}

/** Entrada que recibe `AuditService.record()`. */
export interface AuditEntry {
  action: string;
  entity: string;
  entityId?: number | null;
  description?: string;
  metadata?: AuditMetadata | null;
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
