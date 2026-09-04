import { ConflictException, Injectable } from '@nestjs/common';
import { HealthUnitsRepository } from '../repositories/health-units.repository';
import { CreateHealthUnitDto } from '../dto/create-health-unit.dto';
import { HealthUnit } from '@prisma/client';

@Injectable()
class CreateHealthUnitUseCase {
  constructor(private readonly healthUnitsRepository: HealthUnitsRepository) {}

  async execute(dto: CreateHealthUnitDto): Promise<HealthUnit> {
    if (dto.cnes) {
      const existing = await this.healthUnitsRepository.findByCnes(dto.cnes);
      if (existing) throw new ConflictException('CNES já cadastrado.');
    }

    return this.healthUnitsRepository.create({
      name: dto.name,
      address: dto.address,
      city: dto.city,
      state: dto.state.toUpperCase(),
      cnes: dto.cnes,
      maxTicketsDay: dto.maxTicketsDay,
      openTime: dto.openTime,
      closeTime: dto.closeTime,
    });
  }
}

export { CreateHealthUnitUseCase };
