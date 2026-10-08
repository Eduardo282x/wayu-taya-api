-- ============================================================================
-- Control number: unicidad por (controlNumber, deleted, type).
--
-- Antes era único global, lo que impedía reutilizar el número de control de una
-- donación eliminada (soft-delete). Ahora la unicidad solo aplica entre
-- donaciones activas del mismo tipo, liberando el número al eliminar.
--
-- No hay duplicados preexistentes que impidan crear el índice.
-- ============================================================================

DROP INDEX IF EXISTS "Donation_controlNumber_key";

CREATE UNIQUE INDEX "Donation_controlNumber_deleted_type_key"
    ON "Donation"("controlNumber", "deleted", "type");
