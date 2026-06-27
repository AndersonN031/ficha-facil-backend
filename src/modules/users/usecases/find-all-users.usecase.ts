import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { HealthUnitsRepository } from '@modules/health-units/repositories/health-units.repository';

@Injectable()
class FindAllUsersUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly healthUnitsRepository: HealthUnitsRepository,
  ) {}

  async execute(healthUnitId: string) {
    const unit = await this.healthUnitsRepository.findById(healthUnitId);
    if (!unit) {
      throw new NotFoundException('Posto não encontrado');
    }

    const user = await this.usersRepository.findAllUsers(healthUnitId);
    return user;
  }
}

export { FindAllUsersUseCase };
