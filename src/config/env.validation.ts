import * as Joi from 'joi';

/**
 * Fail-fast: la aplicación no arranca si el entorno es inválido o débil.
 * Antes, un JWT_SECRET ausente producía un secreto vacío silenciosamente.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(3000),

  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required()
    .messages({
      'any.required': 'DATABASE_URL es obligatoria',
      'string.uri': 'DATABASE_URL debe ser una URI postgresql válida',
    }),

  JWT_SECRET: Joi.string().min(64).required().messages({
    'any.required': 'JWT_SECRET es obligatoria',
    'string.min':
      'JWT_SECRET debe tener al menos 64 caracteres. Genera una con: openssl rand -base64 48',
  }),

  JWT_EXPIRES_IN: Joi.string().default('15m'),

  // NO se exige JWT_REFRESH_SECRET: el refresh token no es un JWT, es un valor
  // opaco de 48 bytes aleatorios del que solo se guarda el SHA-256. Exigir un
  // segundo secreto hacia pensar que se usaba cuando realmente no lo hacia.
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  DB_POOL_MAX: Joi.number().integer().min(1).max(100).default(20),
  DB_POOL_MIN: Joi.number().integer().min(0).max(50).default(2),

  ALLOWED_ORIGINS: Joi.string().required().messages({
    'any.required':
      'ALLOWED_ORIGINS es obligatoria. Lista de orígenes separados por comas, p.ej. https://app.example.com',
  }),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'log', 'debug').default('log'),
});
