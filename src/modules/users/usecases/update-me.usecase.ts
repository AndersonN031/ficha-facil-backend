import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../repositories/users.repository';
import { UpdateMeDto } from '../dto/update-me.dto';
import { UserEntity } from '../../auth/entities/user.entity';

@Injectable()
export class UpdateMeUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(userId: string, dto: UpdateMeDto): Promise<UserEntity> {
    const user = await this.usersRepository.findById(userId);

    if (!user) throw new NotFoundException('Usuário não encontrado');

    const dataToUpdate: {
      name?: string;
      phone?: string;
      password?: string;
    } = {};

    if (dto.name) dataToUpdate.name = dto.name;
    if (dto.phone) dataToUpdate.phone = dto.phone;
    if (dto.password)
      dataToUpdate.password = await bcrypt.hash(dto.password, 10);

    const updated = await this.usersRepository.update(userId, dataToUpdate);

    return UserEntity.sanitize(updated);
  }
}
