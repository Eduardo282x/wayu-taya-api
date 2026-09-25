/**
 * Ensayo de la migracion TEXT -> BYTEA de Users.password.
 *
 * 1. Genera hashes bcrypt REALES (no falsos).
 * 2. Los inserta como texto, igual que esta hoy en la BD.
 * 3. Aplica la migracion de hardening.
 * 4. Verifica que el hash vuelve byte a byte identico y que bcrypt.compare
 *    sigue funcionando con el valor leido como Buffer.
 *
 * Uso: pnpm exec ts-node scripts/verify-password-migration.ts
 */
import * as bcrypt from 'bcrypt';
import { Client } from 'pg';

const URL =
  process.env.CHECK_DATABASE_URL ??
  'postgresql://postgres:Earo282*@localhost:5432/wt_pwd_check?schema=public';

const ROLES = [
  { nombre: 'Super Admin', pass: 'SuperAdmin#2026' },
  { nombre: 'Administrador', pass: 'Admin#2026' },
  { nombre: 'Coordinador', pass: 'Coord#2026' },
  { nombre: 'Receptor', pass: 'Receptor#2026' },
];

let fallos = 0;

function check(ok: boolean, msg: string): void {
  console.log(`${ok ? 'OK  ' : 'FALLO'} ${msg}`);
  if (!ok) fallos++;
}

async function main(): Promise<void> {
  const c = new Client({ connectionString: URL });
  await c.connect();

  const col = await c.query<{ data_type: string }>(
    `SELECT data_type FROM information_schema.columns
      WHERE table_name='Users' AND column_name='password'`,
  );
  console.log(`Tipo actual de "Users"."password": ${col.rows[0]?.data_type}\n`);

  // 0: limpiar restos de una ejecucion anterior para que el script sea
  //    re-ejecutable (si no, el preflight de la migracion detectaria los
  //    correos duplicados que este mismo script creo).
  await c.query(`DELETE FROM "Users" WHERE correo LIKE '%@test.local'`);
  await c.query(`DELETE FROM "Role" WHERE rol = ANY($1)`, [
    ROLES.map((r) => r.nombre),
  ]);

  // 1 + 2: hashes bcrypt reales guardados como texto
  const esperados = new Map<number, { hash: string; plano: string }>();
  let rolId = 0;
  for (const r of ROLES) {
    const hash = await bcrypt.hash(r.pass, 12);
    const res = await c.query(
      `INSERT INTO "Role"(rol) VALUES ($1) RETURNING id`,
      [r.nombre],
    );
    const nuevoRol = Number(res.rows[0].id);
    if (rolId === 0) rolId = nuevoRol;

    const usr = await c.query(
      `INSERT INTO "Users"(name,"lastName",correo,username,password,"rolId")
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [
        'Prueba',
        r.nombre,
        `${r.nombre.toLowerCase().replace(/\s+/g, '.')}@test.local`,
        r.nombre.toLowerCase().replace(/\s+/g, '.'),
        hash,
        nuevoRol,
      ],
    );
    esperados.set(Number(usr.rows[0].id), { hash, plano: r.pass });
  }
  console.log(
    `Insertados ${esperados.size} usuarios con hash bcrypt en texto.\n`,
  );

  await c.end();

  // 3: aplicar la migracion
  const { execFileSync } = await import('child_process');
  console.log('Aplicando migracion de hardening...\n');
  execFileSync(
    'npx',
    ['prisma', 'migrate', 'deploy', '--schema', 'prisma/schema.prisma'],
    {
      env: { ...process.env, DATABASE_URL: URL },
      stdio: 'inherit',
      // En Windows los .cmd requieren shell para poder ejecutarse.
      shell: process.platform === 'win32',
    },
  );

  // 4: verificar
  const c2 = new Client({ connectionString: URL });
  await c2.connect();
  console.log('');

  const t2 = await c2.query<{ data_type: string }>(
    `SELECT data_type FROM information_schema.columns
      WHERE table_name='Users' AND column_name='password'`,
  );
  check(t2.rows[0]?.data_type === 'bytea', 'password ahora es BYTEA');

  const filas = await c2.query<{ id: number; password: Buffer }>(
    `SELECT id, password FROM "Users" ORDER BY id`,
  );
  check(
    filas.rows.length === esperados.size,
    `se conservaron los ${esperados.size} usuarios`,
  );

  for (const f of filas.rows) {
    const exp = esperados.get(Number(f.id));
    if (!exp) {
      check(false, `usuario ${f.id} inesperado`);
      continue;
    }
    const leido = Buffer.from(f.password).toString('utf8');
    check(leido === exp.hash, `usuario ${f.id}: hash identico byte a byte`);
    const coincide = await bcrypt.compare(exp.plano, leido);
    check(coincide, `usuario ${f.id}: bcrypt.compare() valida la contrasena`);
  }

  // bcrypt NO acepta Buffer como hash ("data and hash must be strings"), por lo
  // que el codigo de la aplicacion esta OBLIGADO a llamar .toString() sobre el
  // valor leido de Prisma. Este check deja esa regla fijada por escrito.
  const primera = filas.rows[0];
  if (primera) {
    const exp = esperados.get(Number(primera.id));
    let bufferRechazado = false;
    try {
      await bcrypt.compare(exp.plano, primera.password as unknown as string);
    } catch {
      bufferRechazado = true;
    }
    check(
      bufferRechazado,
      'bcrypt rechaza Buffer: la app debe usar .toString() sobre el BYTEA',
    );

    const ok = await bcrypt.compare(
      exp.plano,
      primera.password.toString('utf8'),
    );
    check(ok, 'bcrypt.compare() funciona con el BYTEA convertido a string');
  }

  const nulos = await c2.query(
    `SELECT COUNT(*)::int AS n FROM "Users" WHERE password IS NULL`,
  );
  check(nulos.rows[0].n === 0, 'ninguna contrasena quedo NULL');

  await c2.end();

  console.log(
    fallos === 0
      ? '\nTODO CORRECTO: la migracion conserva las contrasenas.'
      : `\n${fallos} COMPROBACION(ES) FALLIDA(S).`,
  );
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
