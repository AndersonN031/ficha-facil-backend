import { IsString } from 'class-validator';

class UsersDto {
  @IsString()
  name!: string;

  @IsString()
  email!: string;

  @IsString()
  cpf!: string;

  @IsString()
  phone!: string | null;
}

export { UsersDto };
