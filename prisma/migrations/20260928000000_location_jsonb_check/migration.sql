-- ============================================================================
-- location: CHECK de forma en People, Institutions y Events
-- ============================================================================
--
-- POR QUE
--   Al sustituir el arbol Parish -> Town -> City -> State por una columna
--   JSONB, la base perdio las FKs que garantizaban que la ubicacion existent
--   y que era valida. El unico control que quedaba era `LocationDTO` en la
--   API, que no protege contra SQL directo, seeds, migraciones futuras ni
--   escrituras desde otro cliente.
--
--   Este CHECK devuelve esa garantia al motor sin coste en lectura: un CHECK
--   se evalua solo al escribir, no hay indice ni mantenimiento por fila.
--
-- QUE VALIDA
--   Que `location` sea un objeto con las tres claves state, town y parish,
--   las tres de tipo string y ninguna vacia o solo con espacios.
--
-- SOBRE EL TRAPO DE LOS NULL
--   `jsonb_typeof(location->'state') = 'string'` devuelve NULL, no FALSE, si
--   la clave no existe. Una expresion con NULL hace que un CHECK pase (solo
--   falla si da FALSE). Sin la primera clausula `location IS NOT NULL` y sin
--   el `?&`, un objeto al que le faltara una clave podria colarse.
--
--   `location IS NOT NULL` ancla la conjuncion en un booleano real, y `?&`
--   devuelve TRUE/FALSE (nunca NULL), asi que la falta de una clave da FALSE
--   y la constraint salta. La columna ya es NOT NULL; la clausula es defensa
--   en profundidad ante un futuro ALTER COLUMN DROP NOT NULL.
--
-- NOTAS
--   - Se valida al momento del ADD CONSTRAINT. Las 22 filas de la migracion
--     20260927010000_location_jsonb ya cumplen la forma (validadas alli).
--   - Prisma no modela CHECK constraints, asi que no aparecen en schema.prisma
--     ni generan drift en `prisma migrate diff`.
--   - NO EDITAR este archivo una vez registrado en `_prisma_migrations`.
-- ============================================================================

ALTER TABLE "People"
  ADD CONSTRAINT "People_location_shape_check" CHECK (
    "location" IS NOT NULL
    AND jsonb_typeof("location") = 'object'
    AND "location" ?& ARRAY['state', 'town', 'parish']
    AND jsonb_typeof("location" -> 'state')  = 'string'
    AND btrim("location" ->> 'state')  <> ''
    AND jsonb_typeof("location" -> 'town')   = 'string'
    AND btrim("location" ->> 'town')   <> ''
    AND jsonb_typeof("location" -> 'parish') = 'string'
    AND btrim("location" ->> 'parish') <> ''
  );

ALTER TABLE "Institutions"
  ADD CONSTRAINT "Institutions_location_shape_check" CHECK (
    "location" IS NOT NULL
    AND jsonb_typeof("location") = 'object'
    AND "location" ?& ARRAY['state', 'town', 'parish']
    AND jsonb_typeof("location" -> 'state')  = 'string'
    AND btrim("location" ->> 'state')  <> ''
    AND jsonb_typeof("location" -> 'town')   = 'string'
    AND btrim("location" ->> 'town')   <> ''
    AND jsonb_typeof("location" -> 'parish') = 'string'
    AND btrim("location" ->> 'parish') <> ''
  );

ALTER TABLE "Events"
  ADD CONSTRAINT "Events_location_shape_check" CHECK (
    "location" IS NOT NULL
    AND jsonb_typeof("location") = 'object'
    AND "location" ?& ARRAY['state', 'town', 'parish']
    AND jsonb_typeof("location" -> 'state')  = 'string'
    AND btrim("location" ->> 'state')  <> ''
    AND jsonb_typeof("location" -> 'town')   = 'string'
    AND btrim("location" ->> 'town')   <> ''
    AND jsonb_typeof("location" -> 'parish') = 'string'
    AND btrim("location" ->> 'parish') <> ''
  );
