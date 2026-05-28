import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CallNextUseCase } from '../usecases/call-next.usecase';
import { Roles } from '@shared/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { CurrentUserPayload } from '@shared/decorators/current-user.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';

@Controller('tickets')
class TicketsController {
  constructor(private readonly callNextUseCase: CallNextUseCase) {}

  @Roles(Role.RECEPTIONIST)
  @Post('call-next')
  @HttpCode(HttpStatus.OK)
  async callNext(@CurrentUser() user: CurrentUserPayload) {
    return this.callNextUseCase.execute(user.sub);
  }
}

export { TicketsController };
