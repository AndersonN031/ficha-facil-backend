import { Injectable } from '@nestjs/common';
import { QueueRepository } from '../repositories/queue.repository';

@Injectable()
class GetActiveEntryUseCase {
  constructor(private readonly queueRepository: QueueRepository) {}

  async execute(userId: string) {
    const entry = await this.queueRepository.findActiveEntryByUser(userId);
    return entry ?? null;
  }
}

export { GetActiveEntryUseCase };
