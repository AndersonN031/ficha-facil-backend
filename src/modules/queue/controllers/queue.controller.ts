import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { EnterQueueUseCase } from '../usecases/enter-queue.usecase';
import { LeaveQueueUseCase } from '../usecases/leave-queue.usecase';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import type { CurrentUserPayload } from '@shared/decorators/current-user.decorator';
import { GetCachedQueueUseCase } from '../usecases/get-cached-queue.usecase';
import { Public } from '@shared/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('queue')
class QueueController {
  constructor(
    private readonly enterQueueUseCase: EnterQueueUseCase,
    private readonly leaveQueueUseCase: LeaveQueueUseCase,
    private readonly getCachedQueueUseCase: GetCachedQueueUseCase,
  ) {}

  @Public()
  @Get(':unitId')
  async getQueue(@Param('unitId') unitId: string) {
    return this.getCachedQueueUseCase.execute(unitId);
  }

  @Post(':unitId/enter')
  @Throttle({ global: { ttl: 60000, limit: 3 } })
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
