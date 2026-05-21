import { Injectable, NotFoundException } from '@nestjs/common';
import { HealthUnitsRepository } from '../repositories/health-units.repository';

@Injectable()
class DeleteHealthUnitUseCase {
  constructor(private readonly healthUnitsRepository: HealthUnitsRepository) {}

  async execute(id: string): Promise<{ message: string }> {
    const unit = await this.healthUnitsRepository.findById(id);
    if (!unit) throw new NotFoundException('Posto de saúde não encontrado');

    await this.healthUnitsRepository.delete(id);

    return { message: 'Posto desativado com sucesso.' };
  }
}

export { DeleteHealthUnitUseCase };
