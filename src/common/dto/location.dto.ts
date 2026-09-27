import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Geographic location sent by the client as a single nested object.
 *
 * Replaces the former `parishId` foreign key, which forced the frontend to
 * resolve the hierarchy through the `/state`, `/municipios` and `/parroquias`
 * endpoints just to display a label. The whole location now travels with the
 * record, and the reference data stays on the frontend.
 *
 * All three levels are required: a parish name alone is ambiguous, because the
 * reference data contains 98 duplicated parish names across different towns.
 *
 * Use it with `@ValidateNested()` plus `@Type(() => LocationDTO)`. Both are
 * needed: without `@Type` the incoming plain object is never converted into a
 * `LocationDTO` instance, so none of the validators below would run and any
 * shape would be accepted.
 */
export class LocationDTO {
  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  town: string;

  @IsString()
  @IsNotEmpty()
  parish: string;
}

/**
 * Plain shape of a location as it comes out of the database.
 *
 * `location Json` is typed as `Prisma.JsonValue`, which is a union that cannot
 * be indexed. `toLocation` is the single place where that cast happens.
 */
export interface Location {
  state: string;
  town: string;
  parish: string;
}

/**
 * Reads a `location` JSONB column into a `Location`.
 *
 * Missing or malformed values degrade to empty strings instead of throwing:
 * these columns hold display data, and a report should still render if one
 * legacy record has a null or partial object.
 */
export function toLocation(value: unknown): Location {
  if (typeof value !== 'object' || value === null) {
    return { state: '', town: '', parish: '' };
  }

  const source = value as Record<string, unknown>;
  const read = (key: keyof Location): string => {
    const entry = source[key];
    return typeof entry === 'string' ? entry : '';
  };

  return { state: read('state'), town: read('town'), parish: read('parish') };
}

/**
 * Converts a validated `LocationDTO` into the plain object Prisma accepts for a
 * `Json` column.
 *
 * A `LocationDTO` instance cannot be assigned to `InputJsonValue` directly:
 * Prisma's JSON types require an index signature, which class instances do not
 * have. Returning a fresh object literal satisfies it and, as a side effect,
 * guarantees only the three known keys are persisted.
 */
export function toLocationInput(location: LocationDTO): {
  state: string;
  town: string;
  parish: string;
} {
  return {
    state: location.state,
    town: location.town,
    parish: location.parish,
  };
}
