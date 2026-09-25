/**
 * Migracion NO DESTRUCTIVA de contrasenas.
 *
 * Que hace:
 *  - Para cada usuario, lee la contrasena actual.
 *  - Si ya es un hash bcrypt ($2a$/$2b$/$2y$): NO LA TOCA. Los hashes de
 *    produccion se conservan intactos, por lo que los usuarios pueden seguir
 *    entrando con su misma contrasena.
 *  - Si esta en texto plano: la hashea con bcrypt (12 rondas) y la guarda.
 *    Esto es una mejora, no una perdida: la contrasena que el usuario teclea
 *    deja de funcionar.
 *  - Si esta vacia, corrupta o con un formato desconocido: la reporta y NO la
 *    modifica. Borrar o inventar contrasenas es decision del administrador.
 *
 * Que NO hace: nunca borra usuarios, nunca resetea contrasenas, nunca imprime
 * contrasenas ni hashes por pantalla ni en los logs.
 *
 * Funciona antes y despues de la migracion TEXT -> BYTEA: detecta el tipo de
 * la columna y lee/escribe en consecuencia.
 *
 * Uso:
 *   pnpm migrate:passwords            -> simulacro (no escribe nada)
 *   pnpm migrate:passwords --apply    -> aplica los cambios
 *
 * Variables:
 *   DATABASE_URL  (opcional)  cadena de conexion; si falta usa .env
 */
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { Client } from 'pg';

const APLICAR = process.argv.includes('--apply');

/** Formatos de hash bcrypt aceptados como "ya hasheada". */
const BCRYPT_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

/**
 * Consideramos "texto plano" cualquier valor que no sea un hash bcrypt y que
 * tenga forma de contrasena real. Si no cumple, lo dejamos como esta.
 */
function pareceContrasenaEnClaro(valor: string): boolean {
  const v = valor.trim();
  if (v.length < 4 || v.length > 72) return false; // bcrypt corta a 72 bytes
  if (/\s/.test(v)) return false; // una contrasena real casi nunca lleva espacios
  if (v.includes('$')) return false; // parece un hash de otro algoritmo
  return true;
}

type Fila = {
  id: number;
  username: string;
  correo: string;
  password: Buffer | string;
};

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      'Falta DATABASE_URL. Definela en .env o pasala por variable de entorno.',
    );
    process.exit(1);
  }

  const c = new Client({ connectionString: url });
  await c.connect();

  const esBytea = await c
    .query<{ data_type: string }>(
      `SELECT data_type FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'Users' AND column_name = 'password'`,
    )
    .then((r) => r.rows[0]?.data_type === 'bytea')
    .catch(() => false);

  console.log(
    `Tipo de "Users"."password": ${esBytea ? 'bytea (migracion ya aplicada)' : 'text (migracion pendiente)'}`,
  );
  console.log(
    `Modo: ${APLICAR ? 'APLICAR (escribe)' : 'SIMULACRO (no escribe)'}\n`,
  );

  const { rows } = await c.query<Fila>(
    `SELECT id, username, correo, password FROM "Users" ORDER BY id`,
  );

  let yaHasheadas = 0;
  let aHashear = 0;
  let omitidas = 0;
  const pendientes: { id: number; nuevo: string }[] = [];
  const avisos: string[] = [];

  for (const f of rows) {
    const actual =
      typeof f.password === 'string'
        ? f.password
        : Buffer.from(f.password).toString('utf8');

    if (BCRYPT_RE.test(actual)) {
      yaHasheadas++;
      continue;
    }

    if (actual.trim() === '') {
      omitidas++;
      avisos.push(
        `  usuario ${f.id} (${f.username}): contrasena vacia -> se deja como esta`,
      );
      continue;
    }

    if (!pareceContrasenaEnClaro(actual)) {
      omitidas++;
      avisos.push(
        `  usuario ${f.id} (${f.username}): formato desconocido -> se deja como esta`,
      );
      continue;
    }

    aHashear++;
    pendientes.push({
      id: f.id,
      // Se hashea aqui para que el simulacro muestre exactamente el coste real
      // y para que la escritura sea un UPDATE simple y determinista.
      nuevo: await bcrypt.hash(actual, 12),
    });
  }

  console.log(`Usuarios revisados:            ${rows.length}`);
  console.log(`Ya tienen hash bcrypt (intactas): ${yaHasheadas}`);
  console.log(`En texto plano (a hashear):    ${aHashear}`);
  console.log(`Omitidas sin tocar:            ${omitidas}`);

  if (avisos.length) {
    console.log('\nOmitidas (requieren revision manual):');
    avisos.forEach((l) => console.log(l));
  }

  if (!pendientes.length) {
    console.log('\nNada que hacer: no hay contrasenas en texto plano.');
    await c.end();
    return;
  }

  if (!APLICAR) {
    console.log('\nSIMULACRO: no se escribio nada.');
    console.log(
      `Para aplicarlo de verdad: pnpm migrate:passwords --apply (afectaria a ${pendientes.length} usuario(s))`,
    );
    await c.end();
    return;
  }

  console.log('\nAplicando...');
  for (const p of pendientes) {
    // El UPDATE lleva WHERE id para no tocar ninguna otra fila. Si la columna
    // es bytea, Prisma/pg espera un Buffer.
    const valor: string | Buffer = esBytea
      ? Buffer.from(p.nuevo, 'utf8')
      : p.nuevo;
    await c.query(`UPDATE "Users" SET password = $1 WHERE id = $2`, [
      valor,
      p.id,
    ]);
    console.log(`  usuario ${p.id}: contrasena hasheada (12 rondas)`);
  }

  // Verificacion final: releer y confirmar que ya son bcrypt.
  const verificacion = await c.query<{ id: number; password: Buffer | string }>(
    `SELECT id, password FROM "Users" WHERE id = ANY($1::int[])`,
    [pendientes.map((p) => p.id)],
  );
  const fallidos = verificacion.rows.filter((f) => {
    const v =
      typeof f.password === 'string'
        ? f.password
        : Buffer.from(f.password).toString('utf8');
    return !BCRYPT_RE.test(v);
  });

  await c.end();

  if (fallidos.length) {
    console.error(
      `\nERROR: ${fallidos.length} usuario(s) no quedaron hasheados: ${fallidos
        .map((f) => f.id)
        .join(', ')}`,
    );
    process.exit(1);
  }

  console.log(
    `\nListo: ${pendientes.length} contrasena(s) migradas, ${yaHasheadas} intactas.`,
  );
  console.log(
    'AVISO: las contrasenas de texto plano ya no funcionan tal cual; los usuarios deben entrar con su misma contrasena y ahora se validara contra el hash.',
  );
}

main().catch((e) => {
  console.error('Error en la migracion de contrasenas:', e);
  process.exit(1);
});
