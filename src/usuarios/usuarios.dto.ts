import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class DTOUsuarios {
  @IsString()
  username: string;
  @IsString()
  name: string;
  @IsString()
  lastName: string;
  @IsString()
  @IsEmail()
  correo: string;
  @IsNumber()
  rolId: number;
}
export class DTOUsuariosPassword {
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida.' })
  newPassword: string;
}
