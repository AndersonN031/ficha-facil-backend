import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CallNextUseCase } from '../usecases/call-next.usecase';
import { Roles } from '@shared/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { CurrentUserPayload } from '@shared/decorators/current-user.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { GetTicketsUseCase } from '../usecases/get-tickets.usecase';
import { PatchStartTreatmentUseCase } from '../usecases/patch-start-treatment.usecase';

@Controller('tickets')
class TicketsController {
  constructor(
    private readonly callNextUseCase: CallNextUseCase,
    private readonly getTicketsUsecase: GetTicketsUseCase,
    private readonly patchStartTreatmentUsecase: PatchStartTreatmentUseCase,
  ) {}

  @Roles(Role.RECEPTIONIST)
  @Get('today')
  @HttpCode(HttpStatus.OK)
  async findTickets(@CurrentUser() user: CurrentUserPayload) {
    return this.getTicketsUsecase.execute(user.sub);
  }

  @Roles(Role.DOCTOR)
  @Get('doctor/today')
  @HttpCode(HttpStatus.OK)
  async findDoctorTickets(@CurrentUser() user: CurrentUserPayload) {
    return this.getTicketsUsecase.execute(user.sub);
  }

  @Roles(Role.RECEPTIONIST)
  @Post('call-next')
  @HttpCode(HttpStatus.OK)
  async callNext(@CurrentUser() user: CurrentUserPayload) {
    return this.callNextUseCase.execute(user.sub);
  }

  @Roles(Role.DOCTOR)
  @Patch(':id/start')
  @HttpCode(HttpStatus.OK)
  async startTreatment(
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.patchStartTreatmentUsecase.execute(ticketId, user.sub);
  }
}

export { TicketsController };
