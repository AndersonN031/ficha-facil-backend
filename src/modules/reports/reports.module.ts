import { Module } from '@nestjs/common';
import { ReportsController } from './controllers/reports.controller';
import { ReportsRepository } from './repositories/reports.repository';
import { GetDailyReportUseCase } from './usecase/get-daily-report.usecase';
import { TicketsModule } from '@modules/tickets/tickets.module';
import { UsersModule } from '@modules/users/users.module';

@Module({
  imports: [TicketsModule, UsersModule],
  controllers: [ReportsController],
  providers: [ReportsRepository, GetDailyReportUseCase],
})
export class ReportsModule {}
