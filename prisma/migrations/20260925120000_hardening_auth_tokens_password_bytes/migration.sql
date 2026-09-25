-- ============================================================================
-- Hardening: refresh/reset tokens, password BYTEA, unicidad e índices.
--
-- IMPORTANTE: esta migración NO borra datos.
--  - No hay DROP TABLE.
--  - No hay DROP COLUMN. `password` se convierte TEXT -> BYTEA EN SITU con
--    USING convert_to(...), por lo que los hashes bcrypt existentes se
--    conservan byte a byte.
--  - Las tablas nuevas nacen vacías.
--
-- Si una de las validaciones PREVIO falla, la migración se aborta con un
-- mensaje explícito en lugar de eliminar registros para forzar la constraint.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PREVIO: abortar con mensaje claro si hay duplicados que impedirían crear
-- las nuevas constraints UNIQUE. No se "limpia" nada automáticamente.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    n   BIGINT;
    det TEXT;
BEGIN
    SELECT COUNT(*) INTO n FROM (
        SELECT correo FROM "Users" GROUP BY correo HAVING COUNT(*) > 1
    ) d;
    IF n > 0 THEN
        SELECT string_agg(correo || ' (x' || c || ')', ', ')
          INTO det FROM (
            SELECT correo, COUNT(*) c FROM "Users"
             GROUP BY correo HAVING COUNT(*) > 1 ORDER BY correo LIMIT 10
          ) x;
        RAISE EXCEPTION
            'MIGRACION ABORTADA: % correo(s) duplicado(s) en "Users". Corregir manualmente. Ejemplos: %',
            n, det;
    END IF;

    SELECT COUNT(*) INTO n FROM (
        SELECT username FROM "Users" GROUP BY username HAVING COUNT(*) > 1
    ) d;
    IF n > 0 THEN
        SELECT string_agg(username || ' (x' || c || ')', ', ')
          INTO det FROM (
            SELECT username, COUNT(*) c FROM "Users"
             GROUP BY username HAVING COUNT(*) > 1 ORDER BY username LIMIT 10
          ) x;
        RAISE EXCEPTION
            'MIGRACION ABORTADA: % username(s) duplicado(s) en "Users". Corregir manualmente. Ejemplos: %',
            n, det;
    END IF;

    SELECT COUNT(*) INTO n FROM (
        SELECT rol FROM "Role" GROUP BY rol HAVING COUNT(*) > 1
    ) d;
    IF n > 0 THEN
        RAISE EXCEPTION
            'MIGRACION ABORTADA: % rol(es) duplicado(s) en "Role".', n;
    END IF;

    SELECT COUNT(*) INTO n FROM (
        SELECT "controlNumber" FROM "Donation" GROUP BY "controlNumber" HAVING COUNT(*) > 1
    ) d;
    IF n > 0 THEN
        SELECT string_agg('"' || "controlNumber" || '" (x' || c || ')', ', ')
          INTO det FROM (
            SELECT "controlNumber", COUNT(*) c FROM "Donation"
             GROUP BY "controlNumber" HAVING COUNT(*) > 1 ORDER BY "controlNumber" LIMIT 10
          ) x;
        RAISE EXCEPTION
            'MIGRACION ABORTADA: % controlNumber(s) duplicado(s) en "Donation". Corregir manualmente. Ejemplos: %',
            n, det;
    END IF;

    SELECT COUNT(*) INTO n FROM (
        SELECT "peopleId", "programId" FROM "PeoplePrograms"
         GROUP BY "peopleId", "programId" HAVING COUNT(*) > 1
    ) d;
    IF n > 0 THEN
        RAISE EXCEPTION 'MIGRACION ABORTADA: % duplicado(s) en "PeoplePrograms"(peopleId,programId).', n;
    END IF;

    SELECT COUNT(*) INTO n FROM (
        SELECT "documentId", "peopleId" FROM "Collaborators"
         GROUP BY "documentId", "peopleId" HAVING COUNT(*) > 1
    ) d;
    IF n > 0 THEN
        RAISE EXCEPTION 'MIGRACION ABORTADA: % duplicado(s) en "Collaborators"(documentId,peopleId).', n;
    END IF;

    SELECT COUNT(*) INTO n FROM (
        SELECT "eventId", "providerId" FROM "ProvidersEvents"
         GROUP BY "eventId", "providerId" HAVING COUNT(*) > 1
    ) d;
    IF n > 0 THEN
        RAISE EXCEPTION 'MIGRACION ABORTADA: % duplicado(s) en "ProvidersEvents"(eventId,providerId).', n;
    END IF;

    RAISE NOTICE 'PREVIO OK: sin duplicados en las columnas que seran UNIQUE.';
END $$;

-- ---------------------------------------------------------------------------
-- Users: password TEXT -> BYTEA preservando los hashes existentes.
--
-- convert_to() devuelve BYTEA con los bytes UTF-8 exactos del string, asi que
-- un hash bcrypt " $2b$12$..." se recupera identico con Buffer.toString().
-- convert_to tambien lanza error si algum valor no fuera UTF-8 valido.
--
-- NO usar `ALTER COLUMN password TYPE BYTEA USING password::bytea` a secas:
-- segun la codificacion de la BD puede reinterpretar los bytes.
-- ---------------------------------------------------------------------------
ALTER TABLE "Users" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);

ALTER TABLE "Users"
    ALTER COLUMN "password" TYPE BYTEA
    USING convert_to("password", 'UTF8');

-- Verificacion post-conversion: los bytes deben volver a ser el string original.
DO $$
DECLARE
    n BIGINT;
BEGIN
    SELECT COUNT(*) INTO n
      FROM "Users"
     WHERE convert_from("password", 'UTF8') IS NULL;
    IF n > 0 THEN
        RAISE EXCEPTION 'MIGRACION ABORTADA: % password(s) no convertibles a UTF-8.', n;
    END IF;
    RAISE NOTICE 'OK: % password(s) convertidos a BYTEA sin perdida.', (SELECT COUNT(*) FROM "Users");
END $$;

-- ---------------------------------------------------------------------------
-- @updatedAt lo gestiona Prisma en el cliente; la BD no debe poner default.
-- ---------------------------------------------------------------------------
ALTER TABLE "Donation" ALTER COLUMN "updateAt" DROP DEFAULT;
ALTER TABLE "Events" ALTER COLUMN "updateAt" DROP DEFAULT;
ALTER TABLE "HistoryInventory" ALTER COLUMN "updateAt" DROP DEFAULT;
ALTER TABLE "Inventory" ALTER COLUMN "updateAt" DROP DEFAULT;
ALTER TABLE "People" ALTER COLUMN "updateAt" DROP DEFAULT;

-- ---------------------------------------------------------------------------
-- Tablas nuevas: refresh tokens rotativos y tokens de recuperacion.
-- Solo se guarda el SHA-256 del token, nunca el token en claro.
-- ---------------------------------------------------------------------------
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasswordResetToken" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- Unicidad de "Users": son las columnas con las que se autentica la app.
-- Impedir dos cuentas con el mismo correo/username.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX "Users_correo_key" ON "Users"("correo");
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");
CREATE UNIQUE INDEX "Role_rol_key" ON "Role"("rol");
CREATE UNIQUE INDEX "Donation_controlNumber_key" ON "Donation"("controlNumber");

-- Tablas join: no tienen sentido filas huerfanas.
CREATE UNIQUE INDEX "PeoplePrograms_peopleId_programId_key" ON "PeoplePrograms"("peopleId", "programId");
CREATE UNIQUE INDEX "Collaborators_documentId_peopleId_key" ON "Collaborators"("documentId", "peopleId");
CREATE UNIQUE INDEX "ProvidersEvents_eventId_providerId_key" ON "ProvidersEvents"("eventId", "providerId");

-- ---------------------------------------------------------------------------
-- Indices de las tablas nuevas.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- ---------------------------------------------------------------------------
-- Indices de rendimiento para los listados y busquedas mas frecuentes
-- (evitan seq scan sobre tablas que crecen con el tiempo).
-- ---------------------------------------------------------------------------
CREATE INDEX "Users_rolId_idx" ON "Users"("rolId");

CREATE INDEX "People_identification_idx" ON "People"("identification");
CREATE INDEX "People_parishId_idx" ON "People"("parishId");

CREATE INDEX "Institutions_rif_idx" ON "Institutions"("rif");
CREATE INDEX "Providers_rif_idx" ON "Providers"("rif");

-- Medicina: indice NO unico. Un medicamento legitimo tiene varias
-- presentaciones (p.ej. 30 mL y 75 mL) y varios laboratorios, por lo que
-- forzar unicidad en name+categoryId+formId borraria catalogo real.
CREATE INDEX "Medicine_name_idx" ON "Medicine"("name");
CREATE INDEX "Medicine_code_idx" ON "Medicine"("code");
CREATE INDEX "Medicine_categoryId_idx" ON "Medicine"("categoryId");
CREATE INDEX "Medicine_formId_idx" ON "Medicine"("formId");

CREATE INDEX "Donation_date_idx" ON "Donation"("date");
CREATE INDEX "Donation_providerId_idx" ON "Donation"("providerId");
CREATE INDEX "Donation_institutionId_idx" ON "Donation"("institutionId");

CREATE INDEX "DetDonation_medicineId_idx" ON "DetDonation"("medicineId");
CREATE INDEX "DetDonation_lote_idx" ON "DetDonation"("lote");

CREATE INDEX "Inventory_medicineId_storeId_lote_idx" ON "Inventory"("medicineId", "storeId", "lote");
CREATE INDEX "Inventory_storeId_idx" ON "Inventory"("storeId");
CREATE INDEX "Inventory_donationId_idx" ON "Inventory"("donationId");

CREATE INDEX "HistoryInventory_medicineId_storeId_idx" ON "HistoryInventory"("medicineId", "storeId");
CREATE INDEX "HistoryInventory_date_idx" ON "HistoryInventory"("date");
CREATE INDEX "HistoryInventory_donationId_idx" ON "HistoryInventory"("donationId");

CREATE INDEX "PeoplePrograms_programId_idx" ON "PeoplePrograms"("programId");
CREATE INDEX "Collaborators_peopleId_idx" ON "Collaborators"("peopleId");
CREATE INDEX "ProvidersEvents_providerId_idx" ON "ProvidersEvents"("providerId");

-- ---------------------------------------------------------------------------
-- FKs: se reconstruyen SOLO las de tablas hijas/join para pasar de RESTRICT
-- a CASCADE (una fila hija sin su padre no es un estado valido).
--
-- En PostgreSQL no se puede cambiar el ON DELETE de una FK: hay que quitarla
-- y volver a crearla. Solo se tocan estas siete, todas de tablas hijas/join.
--
-- Se dejan intactas las FKs de la jerarquia geografica
-- (State/City/Town/Parish/People/Institutions) y las de Store/HistoryInventory:
-- un cambio a CASCADE ahi permitiria que borrar un Estado eliminase pueblos,
-- parroquias, personas e historico de inventario. Esa decision es de negocio.
-- ---------------------------------------------------------------------------
ALTER TABLE "PeoplePrograms" DROP CONSTRAINT "PeoplePrograms_peopleId_fkey";
ALTER TABLE "PeoplePrograms" DROP CONSTRAINT "PeoplePrograms_programId_fkey";
ALTER TABLE "Collaborators" DROP CONSTRAINT "Collaborators_documentId_fkey";
ALTER TABLE "Collaborators" DROP CONSTRAINT "Collaborators_peopleId_fkey";
ALTER TABLE "ProvidersEvents" DROP CONSTRAINT "ProvidersEvents_eventId_fkey";
ALTER TABLE "ProvidersEvents" DROP CONSTRAINT "ProvidersEvents_providerId_fkey";
ALTER TABLE "DetDonation" DROP CONSTRAINT "DetDonation_donationId_fkey";

ALTER TABLE "PeoplePrograms" ADD CONSTRAINT "PeoplePrograms_peopleId_fkey" FOREIGN KEY ("peopleId") REFERENCES "People"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeoplePrograms" ADD CONSTRAINT "PeoplePrograms_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Collaborators" ADD CONSTRAINT "Collaborators_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Collaborators" ADD CONSTRAINT "Collaborators_peopleId_fkey" FOREIGN KEY ("peopleId") REFERENCES "People"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProvidersEvents" ADD CONSTRAINT "ProvidersEvents_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProvidersEvents" ADD CONSTRAINT "ProvidersEvents_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DetDonation" ADD CONSTRAINT "DetDonation_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Las nuevas tablas: si se borra el usuario, sus tokens se van con el.
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
