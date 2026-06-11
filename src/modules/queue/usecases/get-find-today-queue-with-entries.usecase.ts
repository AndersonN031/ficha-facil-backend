import { Injectable, NotFoundException } from '@nestjs/common';
import { QueueRepository } from '../repositories/queue.repository';

@Injectable()
class GetFindTodayQueueWithEntries {
  constructor(private readonly queueRepository: QueueRepository) {}

  async execute(healthUnitId: string) {
    const queue =
      await this.queueRepository.findTodayQueueWithEntries(healthUnitId);

    if (!queue) throw new NotFoundException('Nenhuma foi encontrada');

    return queue;
  }
}

export { GetFindTodayQueueWithEntries };
