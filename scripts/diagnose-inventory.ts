/**
 * Diagnóstico de solo lectura para datos de donaciones e inventario.
 *
 * No modifica nada. Sirve para revisar los datos existentes después de los
 * errores reportados (stock negativo, claves duplicadas, donaciones en 0).
 *
 * Uso:
 *   pnpm diagnose:inventory
 */
import 'dotenv/config';
import { Client } from 'pg';

interface Check {
  name: string;
  description: string;
  sql: string;
  params?: unknown[];
}

const CHECKS: Check[] = [
  {
    name: 'stock_negativo',
    description: 'Filas de inventario con stock negativo.',
    sql: `SELECT id, "donationId", "medicineId", "storeId", lote, stock
          FROM "Inventory"
          WHERE stock < 0
          ORDER BY id`,
  },
  {
    name: 'inventario_duplicado',
    description:
      'Misma medicina/almacén/lote con más de una fila de inventario.',
    sql: `SELECT "medicineId", "storeId", lote, COUNT(*)::int AS filas,
                 SUM(stock)::int AS stock_total,
                 ARRAY_AGG(id ORDER BY id) AS ids,
                 ARRAY_AGG("donationId" ORDER BY id) AS "donationIds",
                 ARRAY_AGG("admissionDate" ORDER BY id) AS "admissionDates",
                 ARRAY_AGG("expirationDate" ORDER BY id) AS "expirationDates"
          FROM "Inventory"
          GROUP BY "medicineId", "storeId", lote
          HAVING COUNT(*) > 1
          ORDER BY filas DESC, "medicineId", "storeId", lote`,
  },
  {
    name: 'detalles_invalidos',
    description: 'Detalles de donación con cantidad <= 0.',
    sql: `SELECT d.id AS "donationId", d."controlNumber", d.type,
                 det.id AS "detDonationId", det."medicineId", det.amount
          FROM "DetDonation" det
          JOIN "Donation" d ON d.id = det."donationId"
          WHERE det.amount <= 0
          ORDER BY d.id, det.id`,
  },
  {
    name: 'donaciones_sin_detalles',
    description: 'Donaciones activas sin ningún detalle.',
    sql: `SELECT d.id, d."controlNumber", d.type, d.date
          FROM "Donation" d
          LEFT JOIN "DetDonation" det ON det."donationId" = d.id
          WHERE d.deleted = false
          GROUP BY d.id
          HAVING COUNT(det.id) = 0
          ORDER BY d.id`,
  },
  {
    name: 'controles_duplicados_activos',
    description:
      'Números de control repetidos en donaciones activas del mismo tipo.',
    sql: `SELECT "controlNumber", type, COUNT(*)::int AS cantidad,
                 ARRAY_AGG(id ORDER BY id) AS ids
          FROM "Donation"
          WHERE deleted = false
          GROUP BY "controlNumber", type
          HAVING COUNT(*) > 1
          ORDER BY cantidad DESC, "controlNumber"`,
  },
  {
    name: 'inventario_de_donacion_eliminada',
    description:
      'Filas de inventario cuyo donationId apunta a una donación eliminada. Puede ser stock compartido con otras donaciones; revisar antes de borrar.',
    sql: `SELECT inv.id, inv."donationId", inv."medicineId", inv."storeId",
                 inv.lote, inv.stock
          FROM "Inventory" inv
          JOIN "Donation" d ON d.id = inv."donationId"
          WHERE d.deleted = true
          ORDER BY inv.id`,
  },
  {
    name: 'historial_de_donacion_eliminada_activo',
    description:
      'Historial no marcado como eliminado que pertenece a una donación eliminada.',
    sql: `SELECT h.id, h."donationId", h."medicineId", h."storeId",
                 h.type, h.amount, h.lote
          FROM "HistoryInventory" h
          JOIN "Donation" d ON d.id = h."donationId"
          WHERE d.deleted = true AND h.deleted = false
          ORDER BY h.id`,
  },
  {
    name: 'historial_reversiones',
    description:
      'Donaciones con varias reversiones (posible doble reversión histórica).',
    sql: `SELECT "donationId", COUNT(*)::int AS reversiones,
                 MIN("createAt") AS primera, MAX("createAt") AS ultima
          FROM "HistoryInventory"
          WHERE type IN ('Reversión Entrada', 'Reversión Salida')
            AND deleted = false
          GROUP BY "donationId"
          HAVING COUNT(*) > 2
          ORDER BY reversiones DESC, "donationId"`,
  },
];

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Falta DATABASE_URL en el entorno.');
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log('Diagnóstico de donaciones e inventario');
    console.log('=====================================\n');

    for (const check of CHECKS) {
      const { rows } = await client.query(check.sql, check.params);
      console.log(`- ${check.name}: ${rows.length} hallazgo(s)`);
      console.log(`  ${check.description}`);
      if (rows.length > 0) {
        console.log(JSON.stringify(rows, null, 2));
      }
      console.log('');
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
