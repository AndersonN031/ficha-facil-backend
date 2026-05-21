import { Module } from '@nestjs/common';
import { HealthUnitsRepository } from './repositories/health-units.repository';
import { CreateHealthUnitUseCase } from './usecases/create-health-unit.usecase';
import { UpdateHealthUnitUseCase } from './usecases/update-health-unit.usecase';
import { DeleteHealthUnitUseCase } from './usecases/delete-health-unit.usecase';
import { GetHealthUnitUseCase } from './usecases/get-health-unit.usecase';
import { ListHealthUnitUseCase } from './usecases/list-health-units.usecase';
import { HealthUnitsController } from './controllers/health-units.controller';

@Module({
  controllers: [HealthUnitsController],
  providers: [
    HealthUnitsRepository,
    CreateHealthUnitUseCase,
    UpdateHealthUnitUseCase,
    DeleteHealthUnitUseCase,
    GetHealthUnitUseCase,
    ListHealthUnitUseCase,
  ],
  exports: [HealthUnitsRepository],
})
export class HealthUnitsModule {}
