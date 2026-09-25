/**
 * Payload mínimo del JWT.
 *
 * No debe contener datos sensibles: el token viaja en el header
 * `Authorization` y es decodificable por el cliente sin verificar la firma.
 * Por eso NO se incluye `correo` ni `password`.
 *
 * El claim `sub` es el id del usuario, por convención (RFC 7519).
 */
export interface JwtPayload {
  sub: number;
  username: string;
  name: string;
  lastName: string;
  rolId: number;
  rol: string;
  iat?: number;
  exp?: number;
}
