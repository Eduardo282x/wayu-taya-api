import type {
  AuditDonationRef,
  AuditMedicineRef,
  AuditRefs,
  AuditStoreRef,
} from './audit.dto';

type DonationLike = {
  id: number;
  controlNumber?: string | null;
  type?: string | null;
  date?: Date | string | null;
  lote?: string | null;
};

type MedicineLike = {
  id: number;
  name?: string | null;
  code?: string | null;
};

type StoreLike = {
  id: number;
  name?: string | null;
};

type NamedLike = {
  id: number;
  name?: string | null;
};

/** Snapshot compacto de una donación para `metadata.refs`. */
export function buildDonationRef(
  donation?: DonationLike | null,
): AuditDonationRef | undefined {
  if (!donation) return undefined;
  return {
    id: donation.id,
    controlNumber: donation.controlNumber ?? null,
    type: donation.type ?? null,
    date: donation.date ?? null,
    lote: donation.lote ?? null,
  };
}

/** Snapshot compacto de una medicina para `metadata.refs`. */
export function buildMedicineRef(
  medicine?: MedicineLike | null,
): AuditMedicineRef | undefined {
  if (!medicine) return undefined;
  return {
    id: medicine.id,
    name: medicine.name ?? null,
    code: medicine.code ?? null,
  };
}

/** Snapshot compacto de un almacén para `metadata.refs`. */
export function buildStoreRef(
  store?: StoreLike | null,
): AuditStoreRef | undefined {
  if (!store) return undefined;
  return { id: store.id, name: store.name ?? null };
}

/** Construye `metadata.refs` omitiendo las referencias ausentes. */
export function buildRefs(refs: AuditRefs): AuditRefs {
  const entries = Object.entries(refs).filter(
    ([, value]) => value !== undefined,
  );
  return Object.fromEntries(entries);
}

/** Texto legible de una donación (número de control + tipo). */
export function donationLabel(ref?: AuditDonationRef | null): string {
  if (!ref) return 'donación desconocida';
  const control = ref.controlNumber?.trim();
  if (control) {
    return ref.type ? `${control} (${ref.type})` : control;
  }
  return `ID ${ref.id}`;
}

/** Texto legible de una medicina (nombre + código). */
export function medicineLabel(ref?: AuditMedicineRef | null): string {
  if (!ref) return 'medicina desconocida';
  const name = ref.name?.trim();
  if (name) {
    return ref.code ? `"${name}" [${ref.code}]` : `"${name}"`;
  }
  return `ID ${ref.id}`;
}

/** Texto legible de un almacén (nombre). */
export function storeLabel(ref?: AuditStoreRef | null): string {
  if (!ref) return 'almacén desconocido';
  const name = ref.name?.trim();
  return name ? `"${name}"` : `ID ${ref.id}`;
}

/** Texto legible de una institución o proveedor. */
export function namedLabel(
  ref?: NamedLike | null,
  fallback = 'sin nombre',
): string {
  if (!ref) return fallback;
  const name = ref.name?.trim();
  return name || `ID ${ref.id}`;
}
