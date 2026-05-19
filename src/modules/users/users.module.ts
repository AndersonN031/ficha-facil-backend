import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UsersRepository } from './repositories/users.repository';
import { GetMeUseCase } from './usecases/get-me.usecase';
import { UpdateMeUseCase } from './usecases/update-me.usecase';

@Module({
  controllers: [UsersController],
  providers: [UsersRepository, GetMeUseCase, UpdateMeUseCase],
  exports: [UsersRepository],
})
export class UsersModule {}
