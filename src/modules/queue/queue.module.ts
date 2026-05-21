import { HealthUnitsModule } from '@modules/health-units/health-units.module';
import { Module } from '@nestjs/common';
import { QueueController } from './controllers/queue.controller';
import { QueueRepository } from './repositories/queue.repository';
import { EnterQueueUseCase } from './usecases/enter-queue.usecase';
import { LeaveQueueUseCase } from './usecases/leave-queue.usecase';

@Module({
  imports: [HealthUnitsModule],
  controllers: [QueueController],
  providers: [QueueRepository, EnterQueueUseCase, LeaveQueueUseCase],
  exports: [QueueRepository],
})
class QueueModule {}

export { QueueModule };
