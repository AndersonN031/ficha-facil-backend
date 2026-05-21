import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Public } from '../../../shared/decorators/public.decorator';
import { CreateHealthUnitUseCase } from '../usecases/create-health-unit.usecase';
import { UpdateHealthUnitUseCase } from '../usecases/update-health-unit.usecase';
import { DeleteHealthUnitUseCase } from '../usecases/delete-health-unit.usecase';
import { GetHealthUnitUseCase } from '../usecases/get-health-unit.usecase';
import { CreateHealthUnitDto } from '../dto/create-health-unit.dto';
import { UpdateHealthUnitDto } from '../dto/update-health-unit.dto';
import { ListHealthUnitUseCase } from '../usecases/list-health-units.usecase';

@Controller('health-units')
export class HealthUnitsController {
  constructor(
    private readonly createHealthUnitUseCase: CreateHealthUnitUseCase,
    private readonly updateHealthUnitUseCase: UpdateHealthUnitUseCase,
    private readonly deleteHealthUnitUseCase: DeleteHealthUnitUseCase,
    private readonly getHealthUnitUseCase: GetHealthUnitUseCase,
    private readonly listHealthUnitsUseCase: ListHealthUnitUseCase,
  ) {}

  @Public()
  @Get()
  async list(@Query('city') city?: string, @Query('state') state?: string) {
    return this.listHealthUnitsUseCase.execute({ city, state });
  }

  @Public()
  @Get(':id')
  async get(@Param('id') id: string) {
    return this.getHealthUnitUseCase.execute(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() dto: CreateHealthUnitDto) {
    return this.createHealthUnitUseCase.execute(dto);
  }

  @Roles(Role.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateHealthUnitDto) {
    return this.updateHealthUnitUseCase.execute(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.deleteHealthUnitUseCase.execute(id);
  }
}
