import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

class UpdateMeDto {
  @IsString()
  @IsOptional()
  name!: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{10,11}$/, {
    message: 'Telefone deve conter 10 ou 11 dígitos numéricos',
  })
  phone!: string | null;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;
}

export { UpdateMeDto };
