import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '@shared/decorators/roles.decorator';
import { Role } from '@prisma/client';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@shared/decorators/current-user.decorator';
import { GetDailyReportUseCase } from '../usecase/get-daily-report.usecase';

@Controller('reports')
export class ReportsController {
  constructor(private readonly getDailyReportUseCase: GetDailyReportUseCase) {}

  @Roles(Role.ADMIN)
  @Get('daily')
  async getDailyReport(
    @CurrentUser() user: CurrentUserPayload,
    @Query('date') date: string,
  ) {
    const dateStr = date ?? new Date().toISOString().split('T')[0];
    return this.getDailyReportUseCase.execute(user.healthUnitId, dateStr);
  }
}
