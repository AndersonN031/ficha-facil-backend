import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Role } from '@prisma/client';

export class ManageUserDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsUUID()
  healthUnitId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
