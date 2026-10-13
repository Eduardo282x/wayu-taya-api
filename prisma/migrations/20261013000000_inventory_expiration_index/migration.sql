-- Alertas de caducidad: filtra lotes por fecha de expiración.
CREATE INDEX "Inventory_expirationDate_idx" ON "Inventory"("expirationDate");
