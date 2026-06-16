import { Module } from '@nestjs/common';
import { TicketsController } from './controllers/tickets.controller';
import { TicketsRepository } from './repositories/tickets.repository';
import { CallNextUseCase } from './usecases/call-next.usecase';
import { QueueModule } from '../queue/queue.module';
import { UsersModule } from '../users/users.module';
import { GetTicketsUseCase } from './usecases/get-tickets.usecase';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { GetDoctorTicketUseCase } from './usecases/get-doctor-tickets.usecase';

@Module({
  imports: [QueueModule, UsersModule, NotificationsModule],
  controllers: [TicketsController],
  providers: [
    TicketsRepository,
    CallNextUseCase,
    GetTicketsUseCase,
    GetDoctorTicketUseCase,
  ],
  exports: [TicketsRepository],
})
export class TicketsModule {}
