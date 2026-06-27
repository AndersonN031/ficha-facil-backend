import { Body, Controller, Get, Param, Patch, Put } from '@nestjs/common';
import { GetMeUseCase } from '../usecases/get-me.usecase';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import type { CurrentUserPayload } from '@shared/decorators/current-user.decorator';
import { UpdateMeDto } from '../dto/update-me.dto';
import { UpdateMeUseCase } from '../usecases/update-me.usecase';
import { Roles } from '@shared/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ManageUserUseCase } from '../usecases/manage-user.usecase';
import { ManageUserDto } from '../dto/manage-user.dto';
import { FindAllUsersUseCase } from '../usecases/find-all-users.usecase';

@Controller('users')
class UsersController {
  constructor(
    private readonly getMeUseCase: GetMeUseCase,
    private readonly updateMeUseCase: UpdateMeUseCase,
    private readonly manageUserUseCase: ManageUserUseCase,
    private readonly findAllUsersUseCase: FindAllUsersUseCase,
  ) {}

  @Roles(Role.ADMIN)
  @Get('list-users')
  async findAll() {
    return this.findAllUsersUseCase.execute();
  }

  @Get('me')
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    return this.getMeUseCase.execute(user.sub);
  }

  @Put('me')
  async updateMe(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateMeDto,
  ) {
    return this.updateMeUseCase.execute(user.sub, dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':userId/manage')
  async manageUser(
    @Param('userId') userId: string,
    @Body() dto: ManageUserDto,
  ) {
    return this.manageUserUseCase.execute(userId, dto);
  }
}

export { UsersController };
