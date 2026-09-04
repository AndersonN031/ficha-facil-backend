import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { UserEntity } from '@modules/auth/entities/user.entity';

@Injectable()
class GetMeUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findById(id);

    if (!user) throw new NotFoundException('Usuário não encontrado!');

    return UserEntity.sanitize(user);
  }
}

export { GetMeUseCase };
