-- AlterTable
--
-- IF NOT EXISTS: esta migracion nunca se llego a registrar en
-- _prisma_migrations, pero la columna SI existe en las bases creadas con
-- `prisma db push`. Sin el IF NOT EXISTS, `prisma migrate deploy` aborta con
-- "column "capacity" of relation "Store" already exists" y bloquea TODAS las
-- migraciones posteriores, incluida la de hardening de autenticacion.
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "capacity" INTEGER NOT NULL DEFAULT 0;
