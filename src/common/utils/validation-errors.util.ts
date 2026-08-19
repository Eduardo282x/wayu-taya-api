import { ValidationError } from 'class-validator';

const FIELD_LABELS: Record<string, string> = {
  controlNumber: 'Número de control',
  lote: 'Lote',
  type: 'Tipo',
  date: 'Fecha',
  institutionId: 'Institución',
  providerId: 'Proveedor',
  benefited: 'Beneficiados',
  changeDonDetails: 'Cambiar detalles',
  medicines: 'Medicamentos',
  medicineId: 'Medicamento',
  name: 'Nombre',
  description: 'Descripción',
  code: 'Código',
  category: 'Categoría',
  form: 'Forma',
  presentation: 'Presentación',
  temperate: 'Temperatura',
  manufacturer: 'Fabricante',
  activeIngredient: 'Principio activo',
  countryOfOrigin: 'País de origen',
  amount: 'Cantidad',
  storageId: 'Almacén',
  expirationDate: 'Fecha de vencimiento',
  page: 'Página',
  size: 'Tamaño',
  startDate: 'Fecha inicial',
  endDate: 'Fecha final',
};

const CONSTRAINT_MESSAGES: Record<string, string> = {
  isString: 'debe ser un texto',
  isNumber: 'debe ser un número',
  isInt: 'debe ser un número entero',
  isDate: 'debe ser una fecha válida',
  isBoolean: 'debe ser verdadero o falso',
  isArray: 'debe ser un arreglo',
  isIn: 'no está en los valores permitidos',
  isNotEmpty: 'es requerido',
  isOptional: 'es opcional',
  min: 'no cumple con el valor mínimo permitido',
  max: 'excede el valor máximo permitido',
  isEmail: 'debe ser un correo válido',
  isEnum: 'no está en los valores permitidos',
  isDefined: 'es requerido',
  isUUID: 'debe ser un UUID válido',
};

function fieldLabel(field: string): string {
  const leaf = field.split('.').pop() || field;
  return FIELD_LABELS[leaf] ?? leaf;
}

function translateMessage(field: string, key: string): string {
  return `${fieldLabel(field)} ${CONSTRAINT_MESSAGES[key] ?? `presenta un valor inválido (${key})`}`;
}

export function buildValidationDetails(errors: ValidationError[]): {
  field: string;
  messages: string[];
}[] {
  const details: { field: string; messages: string[] }[] = [];

  const walk = (items: ValidationError[], prefix: string) => {
    for (const error of items) {
      const field = prefix ? `${prefix}.${error.property}` : error.property;
      const messages = error.constraints
        ? Object.keys(error.constraints).map((key) =>
            translateMessage(field, key),
          )
        : [];
      if (messages.length > 0) details.push({ field, messages });
      if (error.children?.length) walk(error.children, field);
    }
  };

  walk(errors, '');
  return details;
}