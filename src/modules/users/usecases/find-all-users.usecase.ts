import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
class FindAllUsersUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(healthUnitId: string) {
    const user = await this.usersRepository.findAllUsers(healthUnitId);
    if (!user) {
      throw new NotFoundException('Posto não encontrado');
    }
    return user;
  }
}

export { FindAllUsersUseCase };
