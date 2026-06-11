import { Injectable, NotFoundException } from '@nestjs/common';
import { QueueRepository } from '../repositories/queue.repository';

@Injectable()
class GetTodayQueueWithEntries {
  constructor(private readonly queueRepository: QueueRepository) {}

  async execute(healthUnitId: string) {
    const queue =
      await this.queueRepository.findTodayQueueWithEntries(healthUnitId);

    if (!queue)
      throw new NotFoundException('Nenhuma fila aberta hoje para este posto');

    return queue;
  }
}

export { GetTodayQueueWithEntries };
