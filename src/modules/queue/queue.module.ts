import { HealthUnitsModule } from '@modules/health-units/health-units.module';
import { Module } from '@nestjs/common';
import { QueueController } from './controllers/queue.controller';
import { QueueRepository } from './repositories/queue.repository';
import { EnterQueueUseCase } from './usecases/enter-queue.usecase';
import { LeaveQueueUseCase } from './usecases/leave-queue.usecase';
import { QueueGateway } from './gateway/queue.gateway';
import { GetCachedQueueUseCase } from './usecases/get-cached-queue.usecase';
import { GetActiveEntryUseCase } from './usecases/get-active-entry.usecase';

@Module({
  imports: [HealthUnitsModule],
  controllers: [QueueController],
  providers: [
    QueueRepository,
    QueueGateway,
    EnterQueueUseCase,
    LeaveQueueUseCase,
    GetCachedQueueUseCase,
    GetActiveEntryUseCase,
  ],
  exports: [QueueRepository, QueueGateway],
})
class QueueModule {}

export { QueueModule };
