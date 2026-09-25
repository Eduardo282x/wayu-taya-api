import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 72, // bcrypt trunca silenciosamente a 72 bytes
};

export class DTOLogin {
  @IsString({ message: 'El usuario es requerido' })
  @MaxLength(64, { message: 'El usuario no puede superar los 64 caracteres' })
  @MinLength(3, { message: 'El usuario debe tener al menos 3 caracteres' })
  username: string;

  @IsString({ message: 'La contraseña es requerida' })
  @MaxLength(PASSWORD_RULES.maxLength, {
    message: 'La contraseña no puede superar los 72 caracteres',
  })
  @MinLength(1, { message: 'La contraseña es requerida' })
  password: string;
}

/** PASO 1. Solo pide el correo: la respuesta nunca revela si esta registrado. */
export class DTORecoverPassword {
  @IsEmail({}, { message: 'Debe ser un correo válido' })
  @MaxLength(180, { message: 'El correo no puede superar los 180 caracteres' })
  email: string;
}

export class DTOConfirmReset {
  @IsString({ message: 'El token es requerido' })
  @MinLength(20, { message: 'El token es inválido' })
  @MaxLength(200, { message: 'El token es inválido' })
  token: string;

  @IsString({ message: 'La contraseña es requerida' })
  @MinLength(PASSWORD_RULES.minLength, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  @MaxLength(PASSWORD_RULES.maxLength, {
    message: 'La contraseña no puede superar los 72 caracteres',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'La contraseña debe incluir al menos una minúscula, una mayúscula y un número',
  })
  password: string;
}

export class DTORefreshToken {
  @IsString({ message: 'El refresh token es requerido' })
  @MinLength(20, { message: 'El refresh token es inválido' })
  @MaxLength(500, { message: 'El refresh token es inválido' })
  refreshToken: string;
}

/** Cambio de contraseña del propio usuario: exige la actual. */
export class DTOChangePassword {
  @IsString({ message: 'La contraseña actual es requerida' })
  @MaxLength(PASSWORD_RULES.maxLength, {
    message: 'La contraseña actual no puede superar los 72 caracteres',
  })
  @MinLength(1, { message: 'La contraseña actual es requerida' })
  currentPassword: string;

  @IsString({ message: 'La nueva contraseña es requerida' })
  @MinLength(PASSWORD_RULES.minLength, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  @MaxLength(PASSWORD_RULES.maxLength, {
    message: 'La contraseña no puede superar los 72 caracteres',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'La contraseña debe incluir al menos una minúscula, una mayúscula y un número',
  })
  newPassword: string;
}
