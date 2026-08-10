import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UserDTO {
  @IsString()
  username: string;
  @IsString()
  name: string;
  @IsString()
  lastName: string;
  @IsNumber()
  rolId: number;
}
export class UserPasswordDTO {
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida.' })
  newPassword: string;
}
