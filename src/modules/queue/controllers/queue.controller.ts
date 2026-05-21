import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { EnterQueueUseCase } from '../usecases/enter-queue.usecase';
import { LeaveQueueUseCase } from '../usecases/leave-queue.usecase';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import type { CurrentUserPayload } from '@shared/decorators/current-user.decorator';

@Controller('queue')
class QueueController {
  constructor(
    private readonly enterQueueUseCase: EnterQueueUseCase,
    private readonly leaveQueueUseCase: LeaveQueueUseCase,
  ) {}

  @Post(':unitId/enter')
  async enter(
    @Param('unitId') unitId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.enterQueueUseCase.execute(unitId, user.sub);
  }

  @Delete(':entryId')
  @HttpCode(HttpStatus.OK)
  async leave(
    @Param('entryId') entryId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.leaveQueueUseCase.execute(entryId, user.sub);
  }
}

export { QueueController };
