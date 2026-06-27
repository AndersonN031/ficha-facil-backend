import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
class FindAllUsers {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute() {
    const user = await this.usersRepository.findAllUsers();
    return user;
  }
}

export { FindAllUsers };
