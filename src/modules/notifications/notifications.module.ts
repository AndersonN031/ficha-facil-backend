import { QueueModule } from '@modules/queue/queue.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
    QueueModule,
  ],
  providers: [NotificationsService, NotificationsProcessor],
})
export class NotificationsModule {}
