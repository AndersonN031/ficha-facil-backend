import { QueueGateway } from '@modules/queue/gateway/queue.gateway';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

@Processor('notifications')
class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly queueGateway: QueueGateway) {
    super();
  }
}

export { NotificationsProcessor };
