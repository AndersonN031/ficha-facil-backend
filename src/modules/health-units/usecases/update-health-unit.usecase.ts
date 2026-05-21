import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateHealthUnitDto } from '../dto/update-health-unit.dto';
import { HealthUnitsRepository } from '../repositories/health-units.repository';
import { HealthUnit } from '@prisma/client';

@Injectable()
class UpdateHealthUnitUseCase {
  constructor(private readonly healthUnitsRepository: HealthUnitsRepository) {}

  async execute(id: string, dto: UpdateHealthUnitDto): Promise<HealthUnit> {
    const unit = await this.healthUnitsRepository.findById(id);
    if (!unit) throw new NotFoundException('Posto de saúde não encontrado');

    return this.healthUnitsRepository.update(id, {
      ...dto,
      ...(dto.state && { state: dto.state.toUpperCase() }),
    });
  }
}

export { UpdateHealthUnitUseCase };
