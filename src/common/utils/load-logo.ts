import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Resuelve la ruta absoluta a un asset de forma robusta para desarrollo y
 * producción.
 *
 * En producción solo se despliega `dist/`, por lo que `src/assets/logo.png` no
 * existe. `nest-cli.json` copia `src/assets` a `dist/assets`; este helper prueba
 * varias ubicaciones (incluida `ASSETS_PATH`) y devuelve la primera existente.
 */
export function resolveAssetPath(fileName = 'logo.png'): string | null {
  const candidates = [
    process.env.ASSETS_PATH ? join(process.env.ASSETS_PATH, fileName) : null,
    // src/common/utils -> src/assets (ts) | dist/common/utils -> dist/assets (build)
    join(__dirname, '..', '..', 'assets', fileName),
    join(process.cwd(), 'dist', 'assets', fileName),
    join(process.cwd(), 'src', 'assets', fileName),
  ].filter((candidate): candidate is string => candidate !== null);

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

/**
 * Carga un asset como Buffer. Devuelve `null` (sin lanzar) si no se encuentra o
 * falla la lectura, para que los generadores puedan omitir la imagen.
 */
export function loadAsset(fileName = 'logo.png'): Buffer | null {
  try {
    const assetPath = resolveAssetPath(fileName);
    if (!assetPath) return null;
    return readFileSync(assetPath);
  } catch {
    return null;
  }
}

export function loadLogo(): Buffer | null {
  return loadAsset('logo.png');
}
