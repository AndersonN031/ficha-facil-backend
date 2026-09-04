import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { HealthUnitsRepository } from '@modules/health-units/repositories/health-units.repository';
import { UsersRepository } from '../repositories/users.repository';
import { ManageUserDto } from '../dto/manage-user.dto';

const ROLES_REQUIRING_HEALTH_UNIT: Role[] = [Role.RECEPTIONIST, Role.DOCTOR];

@Injectable()
export class ManageUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly healthUnitsRepository: HealthUnitsRepository,
  ) {}

  async execute(targetUserId: string, dto: ManageUserDto) {
    const user = await this.usersRepository.findById(targetUserId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const incomingRole = dto.role ?? user.role;

    if (ROLES_REQUIRING_HEALTH_UNIT.includes(incomingRole)) {
      if (!dto.healthUnitId && !user.healthUnitId) {
        throw new BadRequestException(
          'RECEPTIONIST e DOCTOR precisam estar vinculados a um posto',
        );
      }
    }

    if (dto.healthUnitId) {
      const unit = await this.healthUnitsRepository.findById(dto.healthUnitId);
      if (!unit) {
        throw new NotFoundException('Posto não encontrado');
      }
      if (!unit.active) {
        throw new BadRequestException('Posto está inativo');
      }
    }

    const healthUnitId = ROLES_REQUIRING_HEALTH_UNIT.includes(incomingRole)
      ? (dto.healthUnitId ?? user.healthUnitId)
      : null;

    return this.usersRepository.manageUser(targetUserId, {
      role: dto.role,
      healthUnitId,
      active: dto.active,
    });
  }
}
