import { Body, Controller, Get, Put } from '@nestjs/common';
import { GetMeUseCase } from '../usecases/get-me.usecase';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import type { CurrentUserPayload } from '@shared/decorators/current-user.decorator';
import { UpdateMeDto } from '../dto/update-me.dto';
import { UpdateMeUseCase } from '../usecases/update-me.usecase';

@Controller('users')
class UsersController {
  constructor(
    private readonly getMeUseCase: GetMeUseCase,
    private readonly updateMeUseCase: UpdateMeUseCase,
  ) {}

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
}

export { UsersController };
