-- ============================================================================
-- location JSONB: reemplaza el arbol Parish -> Town -> City -> State
-- ============================================================================
--
-- ESTA MIGRACION NO ES AUTOEJECUTABLE CONTRA UNA BASE CON DATOS.
--
-- El DDL de Prisma agrega `location JSONB NOT NULL` y elimina `parishId` en la
-- misma sentencia ALTER. Sobre una tabla con filas eso falla: PostgreSQL no
-- puede agregar una columna NOT NULL sin default a una tabla no vacia, y la
-- sentencia ya habria DROPeado `parishId` en el camino de la migracion fallida.
-- Peor: aunque existieran filas, la ubicacion quedaria NULL y se perderia.
--
-- PROCEDIMIENTO PARA UNA BASE YA POBLADA (dev y produccion):
--
--   1. Backup.
--   2. psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
--        -f scripts/migrate_location_to_jsonb.sql
--      Ese script agrega la columna como nullable, hace el backfill uniendo
--      el arbol geodesico, valida que no queden filas a medias, la pasa a NOT
--      NULL y recien entonces elimina FKs, columnas y tablas.
--   3. pnpm exec prisma migrate resolve --applied 20260927010000_location_jsonb
--      Porque el script ya hizo exactamente este trabajo: el historial se
--      registra sin volver a ejecutar el DDL.
--
-- En una base NUEVA (CI, un deploy limpio) no hace falta el script: las
-- migraciones anteriores crean el arbol geodesico pero ninguna tabla de negocio
-- tiene filas, asi que no hay nada que respaldar y este DDL se aplica directo.
--
-- NO EDITAR este archivo una vez registrado en `_prisma_migrations`.
-- ============================================================================

-- DropForeignKey
ALTER TABLE "City" DROP CONSTRAINT "City_stateId_fkey";

-- DropForeignKey
ALTER TABLE "Events" DROP CONSTRAINT "Events_parishId_fkey";

-- DropForeignKey
ALTER TABLE "Institutions" DROP CONSTRAINT "Institutions_parishId_fkey";

-- DropForeignKey
ALTER TABLE "Parish" DROP CONSTRAINT "Parish_townId_fkey";

-- DropForeignKey
ALTER TABLE "People" DROP CONSTRAINT "People_parishId_fkey";

-- DropForeignKey
ALTER TABLE "Town" DROP CONSTRAINT "Town_cityId_fkey";

-- DropIndex
DROP INDEX "People_parishId_idx";

-- AlterTable
ALTER TABLE "Events" DROP COLUMN "parishId",
ADD COLUMN     "location" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Institutions" DROP COLUMN "parishId",
ADD COLUMN     "location" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "People" DROP COLUMN "parishId",
ADD COLUMN     "location" JSONB NOT NULL;

-- DropTable
DROP TABLE "City";

-- DropTable
DROP TABLE "Parish";

-- DropTable
DROP TABLE "State";

-- DropTable
DROP TABLE "Town";
