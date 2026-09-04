import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UsersRepository } from './repositories/users.repository';
import { GetMeUseCase } from './usecases/get-me.usecase';
import { UpdateMeUseCase } from './usecases/update-me.usecase';
import { ManageUserUseCase } from './usecases/manage-user.usecase';
import { HealthUnitsModule } from '@modules/health-units/health-units.module';
import { FindAllUsersUseCase } from './usecases/find-all-users.usecase';

@Module({
  imports: [HealthUnitsModule],
  controllers: [UsersController],
  providers: [
    UsersRepository,
    GetMeUseCase,
    UpdateMeUseCase,
    ManageUserUseCase,
    FindAllUsersUseCase,
  ],
  exports: [UsersRepository],
})
export class UsersModule {}
