import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restringe una ruta a los roles indicados.
 * Requiere que `RolesGuard` esté registrado como APP_GUARD.
 *
 * @example @Roles('Super Admin', 'Administrador')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
