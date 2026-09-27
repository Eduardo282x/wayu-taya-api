-- ============================================================================
-- Migracion de ubicacion: Parish/Town/City/State  ->  location JSONB
-- ============================================================================
--
-- QUE HACE
--   1. Agrega la columna `location JSONB` a Institutions, People y Events.
--   2. Rellena cada fila con el estado y el municipio resueltos por el NOMBRE
--      de la parroquia, y el nombre de la parroquia.
--   3. Verifica que no queden filas sin rellenar y que el JSON sea valido.
--   4. Pasa `location` a NOT NULL.
--   5. Elimina las FKs y columnas `parishId`.
--   6. Elimina las tablas Parish, Town, City y State.
--
-- POR QUE UN MAPA POR NOMBRE Y NO UN JOIN
--   La base tiene `Town`, `City` y `State` VACIAS, los 11 `Parish` apuntan a
--   `townId = 0` (inexistente) y no hay ninguna FK que lo impida. La cadena
--   Parish -> Town -> City -> State esta rota, asi que un JOIN sobre ella
--   actualizaria cero filas y se perderia toda la ubicacion.
--
--   Lo que SI sobrevive es `Parish.name`, y los 11 nombres se resuelven de
--   forma univoca contra el catalogo de referencia (24 estados, 335 municipios,
--   1139 parroquias, 980 nombres unicos). El mapa de abajo cubre exactamente
--   los 11 `parishId` que usan las 14 filas existentes: 1-10 y 278.
--
--   LIMITACION CONOCIDA
--   El mapa esta indexado por nombre y es de una sola ejecucion. Si se agrega
--   una parroquia nueva, este script no la cubre. Para esta migracion es
--   correcto porque el preflight aborta si algun `parishId` no esta en el mapa.
--
-- SEGURIDAD
--   Los pasos 1-4 son aditivos: hasta el paso 5, la informacion original sigue
--   intacta y el script corre dentro de una transaccion que revierte sola ante
--   cualquier error. El paso 5-6 destruye el arbol geodesico, asi que:
--     - HAZ UN BACKUP ANTES de ejecutar.
--     - No uses `prisma db push` ni `prisma migrate dev` para esto: generan
--       `ADD COLUMN location JSONB NOT NULL` sobre tablas con filas y falla.
--
-- USO (PowerShell)
--   $line = Select-String -Path '.env' -Pattern '^\s*DATABASE_URL\s*=' | Select-Object -First 1
--   $url = ((($line.Line -split '=',2)[1].Trim().Trim('"',"'")) -split '\?')[0]
--   $env:PGCLIENTENCODING = 'UTF8'
--   psql "$url" -v ON_ERROR_STOP=1 -f scripts/migrate_location_to_jsonb.sql
--
--   PGCLIENTENCODING=UTF8 no es opcional: los nombres tienen acentos y sin el
--   entrarian corruptos. El `-v ON_ERROR_STOP=1` tampoco: sin el, psql continua
--   tras un error y podria llegar al paso 5 con datos a medio rellenar.
--
--   Este archivo es de UNA SOLA EJECUCION: el paso 6 elimina las tablas.
-- ============================================================================

\set ON_ERROR_STOP on

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Agregar la columna
-- ---------------------------------------------------------------------------

ALTER TABLE "Institutions" ADD COLUMN IF NOT EXISTS "location" JSONB;
ALTER TABLE "People"       ADD COLUMN IF NOT EXISTS "location" JSONB;
ALTER TABLE "Events"       ADD COLUMN IF NOT EXISTS "location" JSONB;


-- ---------------------------------------------------------------------------
-- 2. Mapa de resolucion
-- ---------------------------------------------------------------------------
-- Origen de cada fila: catalogo de referencia del frontend
-- (src/main-load/main-load.data.ts, export `locations`). Los 11 nombres se
-- verificaron como unicos alli antes de escribir este mapa.

CREATE TEMP TABLE location_map (
  parish_name TEXT PRIMARY KEY,
  state       TEXT NOT NULL,
  town        TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO location_map (parish_name, state, town) VALUES
  ('Ucata Laja Lisa',           'Amazonas',   'Atabapo'),
  ('Yapacana Macuruco',         'Amazonas',   'Atabapo'),
  ('Caname Guarinuma',          'Amazonas',   'Atabapo'),
  ('Fernando Girón Tovar',      'Amazonas',   'Atures'),
  ('Luis Alberto Gómez',        'Amazonas',   'Atures'),
  ('Pahueña Limón de Parhueña', 'Amazonas',   'Atures'),
  ('Platanillal Platanillal',   'Amazonas',   'Atures'),
  ('Victorino',                 'Amazonas',   'Maroa'),
  ('Comunidad',                 'Amazonas',   'Maroa'),
  ('Anaco',                     'Anzoátegui', 'Anaco'),
  ('Capital San Francisco',     'Falcón',     'San Francisco');


-- ---------------------------------------------------------------------------
-- 3. Backfill
-- ---------------------------------------------------------------------------
-- El JOIN contra `Parish` solo sirve para traducir `parishId` a nombre; la
-- jerarquia rota (Town/City/State vacias) queda fuera a proposito.

UPDATE "Institutions" AS i
   SET "location" = jsonb_build_object(
         'state',  m."state",
         'town',   m."town",
         'parish', p."name"
       )
  FROM "Parish" p
  JOIN location_map m ON m."parish_name" = p."name"
 WHERE i."parishId" = p."id";

UPDATE "People" AS pe
   SET "location" = jsonb_build_object(
         'state',  m."state",
         'town',   m."town",
         'parish', p."name"
       )
  FROM "Parish" p
  JOIN location_map m ON m."parish_name" = p."name"
 WHERE pe."parishId" = p."id";

UPDATE "Events" AS e
   SET "location" = jsonb_build_object(
         'state',  m."state",
         'town',   m."town",
         'parish', p."name"
       )
  FROM "Parish" p
  JOIN location_map m ON m."parish_name" = p."name"
 WHERE e."parishId" = p."id";


-- ---------------------------------------------------------------------------
-- 4. Preflight: abortar si algo quedo sin rellenar
-- ---------------------------------------------------------------------------
-- 4a. Diagnostico de los parishId huerfanos: un parishId que no existe en
-- `Parish` (o cuya parroquia no esta en el mapa) no se actualizo.

DO $$
DECLARE
  huerfanos int;
  detalle   text;
BEGIN
  SELECT count(*) INTO huerfanos FROM (
    SELECT i."parishId" FROM "Institutions" i
      LEFT JOIN "Parish" p ON p."id" = i."parishId"
      LEFT JOIN location_map m ON m."parish_name" = p."name"
     WHERE m."parish_name" IS NULL
    UNION ALL
    SELECT pe."parishId" FROM "People" pe
      LEFT JOIN "Parish" p ON p."id" = pe."parishId"
      LEFT JOIN location_map m ON m."parish_name" = p."name"
     WHERE m."parish_name" IS NULL
    UNION ALL
    SELECT e."parishId" FROM "Events" e
      LEFT JOIN "Parish" p ON p."id" = e."parishId"
      LEFT JOIN location_map m ON m."parish_name" = p."name"
     WHERE m."parish_name" IS NULL
  ) AS sub;

  IF huerfanos > 0 THEN
    SELECT string_agg(DISTINCT tab || '=' || pid::text, ', ') INTO detalle FROM (
      SELECT 'Institutions' AS tab, i."parishId" AS pid FROM "Institutions" i
        LEFT JOIN "Parish" p ON p."id" = i."parishId"
        LEFT JOIN location_map m ON m."parish_name" = p."name"
       WHERE m."parish_name" IS NULL
      UNION ALL
      SELECT 'People', pe."parishId" FROM "People" pe
        LEFT JOIN "Parish" p ON p."id" = pe."parishId"
        LEFT JOIN location_map m ON m."parish_name" = p."name"
       WHERE m."parish_name" IS NULL
      UNION ALL
      SELECT 'Events', e."parishId" FROM "Events" e
        LEFT JOIN "Parish" p ON p."id" = e."parishId"
        LEFT JOIN location_map m ON m."parish_name" = p."name"
       WHERE m."parish_name" IS NULL
    ) AS d;

    RAISE EXCEPTION
      'MIGRACION ABORTADA: % parishId(s) sin resolucion (%). Agregalos a location_map. Se revierte todo.',
      huerfanos, detalle;
  END IF;
END $$;

-- 4b. Ninguna fila puede quedar con location NULL.

DO $$
DECLARE
  i int; p int; e int;
BEGIN
  SELECT count(*) INTO i FROM "Institutions" WHERE "location" IS NULL;
  SELECT count(*) INTO p FROM "People"       WHERE "location" IS NULL;
  SELECT count(*) INTO e FROM "Events"       WHERE "location" IS NULL;

  IF i + p + e > 0 THEN
    RAISE EXCEPTION
      'MIGRACION ABORTADA: Institutions=% People=% Events=% con location NULL. Se revierte todo.', i, p, e;
  END IF;

  RAISE NOTICE 'Backfill OK: Institutions=% People=% Events=%',
    (SELECT count(*) FROM "Institutions"),
    (SELECT count(*) FROM "People"),
    (SELECT count(*) FROM "Events");
END $$;

-- 4c. La forma del JSON debe ser correcta y sin cadenas vacias.

DO $$
DECLARE
  invalidas int;
BEGIN
  SELECT count(*) INTO invalidas
    FROM (
      SELECT "location" FROM "Institutions"
      UNION ALL SELECT "location" FROM "People"
      UNION ALL SELECT "location" FROM "Events"
    ) AS t
   WHERE jsonb_typeof("location") <> 'object'
      OR NOT ("location" ?& ARRAY['state', 'town', 'parish'])
      OR jsonb_typeof("location" -> 'state')  <> 'string'
      OR jsonb_typeof("location" -> 'town')   <> 'string'
      OR jsonb_typeof("location" -> 'parish') <> 'string'
      OR btrim("location" ->> 'state')  = ''
      OR btrim("location" ->> 'town')   = ''
      OR btrim("location" ->> 'parish') = '';

  IF invalidas > 0 THEN
    RAISE EXCEPTION
      'MIGRACION ABORTADA: % ubicacion(es) con forma invalida o valores vacios. Se revierte todo.', invalidas;
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 5. location NOT NULL
-- ---------------------------------------------------------------------------
-- Los preflights ya garantizan que no hay NULLs, asi que esto no puede fallar.

ALTER TABLE "Institutions" ALTER COLUMN "location" SET NOT NULL;
ALTER TABLE "People"       ALTER COLUMN "location" SET NOT NULL;
ALTER TABLE "Events"       ALTER COLUMN "location" SET NOT NULL;


-- ---------------------------------------------------------------------------
-- 6. Quitar FKs y columnas parishId
-- ---------------------------------------------------------------------------
-- Las restricciones se resuelven por catalogo, no por el nombre que Prisma
-- genera, para no depender de esa convencion.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT conrelid::regclass AS tabla, conname
      FROM pg_constraint
     WHERE contype = 'f'
       AND confrelid::regclass::text IN ('"Parish"', 'Parish')
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tabla, r.conname);
    RAISE NOTICE 'FK eliminada: % . %', r.tabla, r.conname;
  END LOOP;
END $$;

ALTER TABLE "Institutions" DROP COLUMN IF EXISTS "parishId";
ALTER TABLE "People"       DROP COLUMN IF EXISTS "parishId";
ALTER TABLE "Events"       DROP COLUMN IF EXISTS "parishId";

DROP INDEX IF EXISTS "People_parishId_idx";


-- ---------------------------------------------------------------------------
-- 7. Eliminar el arbol geodesico
-- ---------------------------------------------------------------------------
-- Orden inverso de dependencias. DROP TABLE sin CASCADE para que una
-- dependencia inesperada haga fallar el script en vez de borrar de mas.

DROP TABLE IF EXISTS "Parish";
DROP TABLE IF EXISTS "Town";
DROP TABLE IF EXISTS "City";
DROP TABLE IF EXISTS "State";

COMMIT;

-- ============================================================================
-- Verificacion posterior (consultas de solo lectura)
--
--   SELECT "id", jsonb_pretty("location") FROM "Institutions";
--   SELECT count(*) FROM "People" WHERE "location" IS NULL;   -- debe dar 0
--   SELECT count(*) FROM "Events" WHERE "location" IS NULL;   -- debe dar 0
-- ============================================================================
