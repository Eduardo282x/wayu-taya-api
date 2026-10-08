-- ============================================================================
-- Soft-delete para HistoryInventory.
--
-- Al eliminar una donación su historial ya no se borra físicamente: se marca
-- con `deleted`/`deletedAt`, de modo que el asiento de reversión y los
-- movimientos de salida/transferencia sigan siendo auditables.
--
-- Solo agrega columnas nuevas (con default), no altera datos existentes.
-- ============================================================================

ALTER TABLE "HistoryInventory"
    ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "HistoryInventory_deleted_idx" ON "HistoryInventory"("deleted");
