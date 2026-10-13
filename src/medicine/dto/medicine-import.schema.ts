import { z } from 'zod';

/**
 * Fuente única de validación para las filas de la plantilla de carga masiva de
 * medicinas. Las claves coinciden EXACTAMENTE con las cabeceras del Excel
 * (`MEDICINE_EXCEL_FIELDS`), de modo que el mismo contrato puede compartirse
 * con el frontend sin crear dos verdades.
 *
 * Nota: se usan `preprocess` para tolerar los valores crudos que entrega
 * exceljs (números, celdas vacías, etc.) y normalizarlos a string.
 */
const asString = z.preprocess(
  (value) => (value === null || value === undefined ? '' : String(value)),
  z.string(),
);

const trimmedString = z.preprocess(
  (value) =>
    value === null || value === undefined ? '' : String(value).trim(),
  z.string(),
);

export const medicineImportRowSchema = z.object({
  Codigo: z.preprocess(
    (value) =>
      value === null || value === undefined ? undefined : String(value),
    z.string().optional(),
  ),
  Nombre: z.preprocess(
    (value) =>
      value === null || value === undefined ? '' : String(value).trim(),
    z.string().min(1, 'El nombre es obligatorio'),
  ),
  Presentacion: asString,
  Forma: asString,
  Categoria: asString,
  Medicina: z.preprocess(
    (value) => (value === null || value === undefined ? 'No' : String(value)),
    z.string(),
  ),
  'Lote (base)': asString,
  Temperatura: asString,
  Fabricante: asString,
  Proveedor: asString,
  'Principio Activo': asString,
  'Pais Origen': trimmedString,
  Descripcion: asString,
});

export type MedicineImportRow = z.infer<typeof medicineImportRowSchema>;

export interface MedicineImportRowError {
  row: number;
  field: string;
  message: string;
}
