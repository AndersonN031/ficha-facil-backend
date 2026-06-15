import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

export interface NotifyPatientJob {
  healthUnitId: string;
  userId: string;
  ticketNumber: number;
  position: number;
  message: string;
}

@Injectable()
class NotificationsService {
  constructor(
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) {}

  async notifyPatientCalled(data: NotifyPatientJob): Promise<void> {
    await this.notificationsQueue.add('ticket:called', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: true,
    });
  }
}

export { NotificationsService };
