import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  Matches,
  Length,
} from 'class-validator';

export class CreateHealthUnitDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @Length(2, 2, { message: 'Estado deve ter 2 caracteres. Ex: PE, SP' })
  state!: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{7}$/, { message: 'CNES deve conter 7 dígitos numéricos' })
  cnes?: string;

  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  maxTicketsDay?: number;

  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Horário inválido. Use o formato HH:MM',
  })
  openTime?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Horário inválido. Use o formato HH:MM',
  })
  closeTime?: string;
}
