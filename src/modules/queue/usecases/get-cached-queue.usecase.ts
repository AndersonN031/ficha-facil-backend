import { Injectable, NotFoundException } from '@nestjs/common';
import { QueueRepository } from '../repositories/queue.repository';
import { Queue } from '@prisma/client';

@Injectable()
export class GetCachedQueueUseCase {
  constructor(private readonly queueRepository: QueueRepository) {}

  async execute(healthUnitId: string): Promise<Queue> {
    const queue = await this.queueRepository.getCachedQueue(healthUnitId);

    if (!queue) {
      throw new NotFoundException('Nenhuma fila aberta hoje para este posto');
    }

    return queue;
  }
}
