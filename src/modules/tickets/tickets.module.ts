import { Module } from '@nestjs/common';
import { TicketsController } from './controllers/tickets.controller';
import { TicketsRepository } from './repositories/tickets.repository';
import { CallNextUseCase } from './usecases/call-next.usecase';
import { QueueModule } from '../queue/queue.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [QueueModule, UsersModule],
  controllers: [TicketsController],
  providers: [TicketsRepository, CallNextUseCase],
  exports: [TicketsRepository],
})
export class TicketsModule {}
