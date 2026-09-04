import { PartialType } from '@nestjs/mapped-types';
import { CreateHealthUnitDto } from './create-health-unit.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateHealthUnitDto extends PartialType(CreateHealthUnitDto) {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
