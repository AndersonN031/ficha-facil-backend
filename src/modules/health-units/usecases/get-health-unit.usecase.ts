import { Injectable, NotFoundException } from '@nestjs/common';
import { HealthUnitsRepository } from '../repositories/health-units.repository';
import { HealthUnit } from '@prisma/client';

@Injectable()
class GetHealthUnitUseCase {
  constructor(private readonly healthUnitsRepository: HealthUnitsRepository) {}

  async execute(id: string): Promise<HealthUnit> {
    const unit = await this.healthUnitsRepository.findById(id);
    if (!unit) throw new NotFoundException('Posto de saúde não encontrado');

    return unit;
  }
}
export { GetHealthUnitUseCase };
