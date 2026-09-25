import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UserDTO {
  @IsString()
  @MinLength(3, { message: 'El usuario debe tener al menos 3 caracteres' })
  @MaxLength(64, { message: 'El usuario no puede superar los 64 caracteres' })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'El usuario solo puede letras, números, punto, guion y guion bajo',
  })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(120)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @MaxLength(120)
  lastName: string;

  @IsEmail({}, { message: 'Debe ser un correo válido' })
  @MaxLength(180)
  correo: string;

  @IsInt({ message: 'El rol es requerido' })
  @Min(1, { message: 'Rol inválido' })
  rolId: number;

  /**
   * Solo en la creación. El hash se genera en el servicio con bcrypt.
   * Antes se aceptaba la contraseña por el endpoint de cambio y se guardaba
   * en texto plano.
   */
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, {
    message: 'La contraseña no puede superar los 72 caracteres',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'La contraseña debe incluir al menos una minúscula, una mayúscula y un número',
  })
  password?: string;
}

export class UserPasswordDTO {
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, {
    message: 'La contraseña no puede superar los 72 caracteres',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'La contraseña debe incluir al menos una minúscula, una mayúscula y un número',
  })
  newPassword: string;
}

/** Un usuario solo puede editar su propio perfil. */
export class ProfileDTO {
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'El usuario solo puede letras, números, punto, guion y guion bajo',
  })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(120)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @MaxLength(120)
  lastName: string;
}
