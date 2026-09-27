-- ============================================================================
-- Migracion de ubicacion: Parish/Town/City/State  ->  location JSONB
-- ============================================================================
--
-- QUE HACE
--   1. Agrega la columna `location JSONB` a Institutions, People y Events.
--   2. Rellena cada fila uniendo el arbol geodesico actual, para que ningun
--      registro se quede sin ubicacion.
--   3. Verifica que no queden filas sin rellenar y que el JSON sea valido.
--   4. Pasa `location` a NOT NULL.
--   5. Elimina las FKs y columnas `parishId`.
--   6. Elimina las tablas Parish, Town, City y State.
--
-- POR QUE
--   Esas cuatro tablas eran datos de referencia que no cambiaban por registro,
--   y obligaban a traversing un join de cuatro niveles en cada lectura. La
--   ubicacion ahora viaja dentro del propio registro como {state, town, parish}.
--
-- SEGURIDAD
--   El backfill es reversible hasta el paso 5: mientras las tablas existan, la
--   informacion original sigue ahi. Los pasos 1-4 son puramente aditivos.
--   El paso 5 y 6 destruyen el arbol geodesico, asi que:
--     - HAZ UN BACKUP ANTES de ejecutar.
--     - El script ABORTA en el paso 3 si falta alguna ubicacion, en lugar de
--       dejar registros con location NULL.
--
--   La precondicion importante: los pasos 1-4 deben ejecutarse sobre la base
--   ANTES de aplicar la migracion de Prisma que elimina las columnas del
--   schema, o el codigo nuevo no encontrara `location`.
--
-- USO
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/migrate_location_to_jsonb.sql
--
--   El -v ON_ERROR_STOP=1 es importante: sin el, psql continua tras un error y
--   podria llegar al paso 5 con datos a medio rellenar.
-- ============================================================================

\set ON_ERROR_STOP on

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Agregar la columna
-- ---------------------------------------------------------------------------
-- IF NOT EXISTS para que el script sea reejecutable.

ALTER TABLE "Institutions" ADD COLUMN IF NOT EXISTS "location" JSONB;
ALTER TABLE "People"       ADD COLUMN IF NOT EXISTS "location" JSONB;
ALTER TABLE "Events"       ADD COLUMN IF NOT EXISTS "location" JSONB;


-- ---------------------------------------------------------------------------
-- 2. Backfill
-- ---------------------------------------------------------------------------
-- El objeto se arma con State.name, Town.name y Parish.name.
--
-- El join exige la cadena COMPLETA Parish -> Town -> City -> State. No se usa
-- LEFT JOIN a proposito: si una relacion esta rota (por ejemplo un Parish con
-- townId que no existe), el LEFT JOIN devolveria NULLs y la fila se guardaria
-- con una ubicacion incompleta. Con INNER JOIN la fila simplemente no se
-- actualiza, y el paso 3 la detecta y aborta la migracion.

UPDATE "Institutions" AS i
   SET "location" = jsonb_build_object(
         'state',  s."name",
         'town',   t."name",
         'parish', p."name"
       )
  FROM "Parish" p
  JOIN "Town"  t ON t."id" = p."townId"
  JOIN "City"  c ON c."id" = t."cityId"
  JOIN "State" s ON s."id" = c."stateId"
 WHERE i."parishId" = p."id";

UPDATE "People" AS pe
   SET "location" = jsonb_build_object(
         'state',  s."name",
         'town',   t."name",
         'parish', p."name"
       )
  FROM "Parish" p
  JOIN "Town"  t ON t."id" = p."townId"
  JOIN "City"  c ON c."id" = t."cityId"
  JOIN "State" s ON s."id" = c."stateId"
 WHERE pe."parishId" = p."id";

UPDATE "Events" AS e
   SET "location" = jsonb_build_object(
         'state',  s."name",
         'town',   t."name",
         'parish', p."name"
       )
  FROM "Parish" p
  JOIN "Town"  t ON t."id" = p."townId"
  JOIN "City"  c ON c."id" = t."cityId"
  JOIN "State" s ON s."id" = c."stateId"
 WHERE e."parishId" = p."id";


-- ---------------------------------------------------------------------------
-- 3. Preflight: abortar si quedo algo sin rellenar
-- ---------------------------------------------------------------------------
-- Por eso el paso 4 usa NOT NULL: convierte "se me olvido una fila" en un error
-- de base de datos en vez de un NULL silencioso que llegaria al reporte.

DO $$
DECLARE
  faltantes int;
  detalle  text;
BEGIN
  SELECT
    (SELECT count(*) FROM "Institutions" WHERE "location" IS NULL) +
    (SELECT count(*) FROM "People"       WHERE "location" IS NULL) +
    (SELECT count(*) FROM "Events"       WHERE "location" IS NULL)
  INTO faltantes;

  IF faltantes > 0 THEN
    SELECT string_agg(tabla || '=' || cant::text, ', ' ORDER BY tabla)
      INTO detalle
      FROM (
        SELECT 'Institutions' AS tabla, count(*) AS cant FROM "Institutions" WHERE "location" IS NULL
        UNION ALL SELECT 'People',   count(*) FROM "People"   WHERE "location" IS NULL
        UNION ALL SELECT 'Events',   count(*) FROM "Events"   WHERE "location" IS NULL
      ) AS sub;

    RAISE EXCEPTION
      'MIGRACION ABORTADA: % fila(s) sin ubicacion (%). Se revierte todo.', faltantes, detalle;
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 3b. Preflight: validar la forma del JSON
-- ---------------------------------------------------------------------------
-- jsonb_build_object garantiza la forma, pero si alguien edito el JSON a mano
-- esta comprobacion lo detecta antes de que la aplicacion lo lea.

DO $$
DECLARE
  invalidas int;
  detalle   text;
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
-- 3c. Reporte antes de seguir (informativo, no aborta)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  i int; p int; e int;
BEGIN
  SELECT count(*) INTO i FROM "Institutions";
  SELECT count(*) INTO p FROM "People";
  SELECT count(*) INTO e FROM "Events";
  RAISE NOTICE 'Backfill completo: Institutions=%, People=%, Events=%', i, p, e;
END $$;


-- ---------------------------------------------------------------------------
-- 4. location NOT NULL
-- ---------------------------------------------------------------------------

ALTER TABLE "Institutions" ALTER COLUMN "location" SET NOT NULL;
ALTER TABLE "People"       ALTER COLUMN "location" SET NOT NULL;
ALTER TABLE "Events"       ALTER COLUMN "location" SET NOT NULL;


-- ---------------------------------------------------------------------------
-- 5. Quitar FKs y columnas parishId
-- ---------------------------------------------------------------------------
-- Los nombres de las restricciones siguen la convencion de Prisma, pero se
-- resuelven por catalogo para no depender de ella.

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
    RAISE NOTICE 'FK eliminada: %.%', r.tabla, r.conname;
  END LOOP;
END $$;

ALTER TABLE "Institutions" DROP COLUMN IF EXISTS "parishId";
ALTER TABLE "People"       DROP COLUMN IF EXISTS "parishId";
ALTER TABLE "Events"       DROP COLUMN IF EXISTS "parishId";

-- El indice que accompanimenta a la FK en People deja de ser util.
DROP INDEX IF EXISTS "People_parishId_idx";


-- ---------------------------------------------------------------------------
-- 6. Eliminar el arbol geodesico
-- ---------------------------------------------------------------------------
-- Orden inverso de dependencias: Parish -> Town -> City -> State.
-- DROP TABLE sin CASCADE para que un dependencia inesperada haga fallar el
-- script en vez de borrar cosas de mas.

DROP TABLE IF EXISTS "Parish";
DROP TABLE IF EXISTS "Town";
DROP TABLE IF EXISTS "City";
DROP TABLE IF EXISTS "State";

COMMIT;


-- ============================================================================
-- Verificacion posterior (consulta de solo lectura)
--
--   SELECT jsonb_pretty("location") FROM "Institutions" LIMIT 5;
--   SELECT count(*) FROM "Institutions" WHERE "location" IS NULL;
--
-- Lo esperado: la primera devuelve objetos {state, town, parish} y la segunda
-- devuelve 0.
-- ============================================================================
