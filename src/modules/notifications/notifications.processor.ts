import { QueueGateway } from '@modules/queue/gateway/queue.gateway';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotifyPatientJob } from './notifications.service';

@Processor('notifications')
class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly queueGateway: QueueGateway) {
    super();
  }

  async process(job: Job<NotifyPatientJob>): Promise<void> {
    const { healthUnitId, userId, ticketNumber, position, message } = job.data;

    this.logger.log(
      `Processando notificação - ticket #${ticketNumber} para userId ${userId}`,
    );

    this.queueGateway.emitTicketCalled(healthUnitId, {
      userId,
      position,
      message,
    });

    this.logger.log(
      `Notificação enviada com sucesso - ticket #${ticketNumber}`,
    );
  }
}

export { NotificationsProcessor };
