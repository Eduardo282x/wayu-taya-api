-- Baseline del drift detectado por `prisma migrate dev` el 2026-09-27.
--
-- CONTEXTO
-- Las columnas de abajo EXISTEN en las bases creadas con `prisma db push`,
-- pero ninguna migracion del historial las creaba. `db push` altera la base
-- sin escribir nada en `_prisma_migrations`, por lo que la base quedo por
-- delante del historial y `migrate dev` exigia resetearla.
--
-- Origen de cada hueco, tras cruzar el historial con el schema:
--   * `deleted` existe en People, Programs, Documents, Events y Providers
--     (20250521011045_supabase) y en Institutions (20260630053807_init).
--     Nunca se creo en Users, Donation ni Store.
--   * `phone` y `responsible` solo se crearon en Providers
--     (20250409020133_init y 20260808161006_medicine_simplify), nunca en
--     Institutions.
--   * `provider` no la crea ninguna migracion.
--   * `Donation.controlNumber` se creo con DEFAULT '' en
--     20260819120000_donation_control_number, pero el schema lo declara sin
--     default.
--
-- SEGURIDAD
-- Todas las operaciones son ADITIVAS: 6 columnas nuevas y 1 default.
-- Ninguna borra datos, columnas ni tablas.
--
-- Se usa IF NOT EXISTS para que la migracion sea segura tanto en dev (donde
-- las columnas ya existen) como en una base nueva o en produccion (donde no).
-- `ALTER COLUMN ... DROP DEFAULT` es idempotente por naturaleza.
--
-- En dev esta migracion NO se ejecuta: se registra con
-- `prisma migrate resolve --applied`, porque su efecto ya esta presente.
--
-- NO EDITAR este archivo una vez registrado en `_prisma_migrations`: el checksum
-- quedaria desactualizado y `migrate deploy` fallaria en produccion. Cualquier
-- cambio futuro va en una carpeta de migracion nueva.

-- Drift: Users.deleted
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "deleted" BOOLEAN NOT NULL DEFAULT false;

-- Drift: Donation.deleted
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "deleted" BOOLEAN NOT NULL DEFAULT false;

-- Drift: Store.deleted
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "deleted" BOOLEAN NOT NULL DEFAULT false;

-- Drift: Institutions.responsible
ALTER TABLE "Institutions" ADD COLUMN IF NOT EXISTS "responsible" TEXT NOT NULL DEFAULT '';

-- Drift: Institutions.phone
ALTER TABLE "Institutions" ADD COLUMN IF NOT EXISTS "phone" TEXT NOT NULL DEFAULT '';

-- Drift: Medicine.provider
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT '';

-- Drift: 20260819120000 creo controlNumber con DEFAULT ''; el schema lo declara
-- sin default. Se alinea el default con el schema.
ALTER TABLE "Donation" ALTER COLUMN "controlNumber" DROP DEFAULT;
