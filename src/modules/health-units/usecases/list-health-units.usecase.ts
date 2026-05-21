import { Injectable } from '@nestjs/common';
import { HealthUnitsRepository } from '../repositories/health-units.repository';
import { HealthUnit } from '@prisma/client';

interface ListFilters {
  city?: string;
  state?: string;
}

@Injectable()
class ListHealthUnitUseCase {
  constructor(private readonly healthUnitsRepository: HealthUnitsRepository) {}

  async execute(filters: ListFilters): Promise<HealthUnit[]> {
    return this.healthUnitsRepository.findAll({
      city: filters.city,
      state: filters.state,
      onlyActive: true,
    });
  }
}

export { ListHealthUnitUseCase };
