import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueueRepository } from '../repositories/queue.repository';
import { QueueEntry } from '@prisma/client';
import { RedisService } from 'src/config/redis.config';
import { QueueGateway } from '../gateway/queue.gateway';

@Injectable()
class LeaveQueueUseCase {
  constructor(
    private readonly queueRepository: QueueRepository,
    private readonly redisService: RedisService,
    private readonly queueGateway: QueueGateway,
  ) {}

  async execute(entryId: string, userId: string): Promise<QueueEntry> {
    const entry = await this.queueRepository.findEntryById(entryId);
    if (!entry) throw new NotFoundException('Entrada na fila não encontrada');

    if (entry.userId !== userId) {
      throw new ForbiddenException(
        'Você não pode cancelar a entrada de outro paciente',
      );
    }

    if (entry.status !== 'WAITING') {
      throw new BadRequestException(
        'Não é possível cancelar — você já foi chamado ou o atendimento foi concluído',
      );
    }

    const cancelled = await this.queueRepository.cancelEntry(entryId);

    const updatedQueue = await this.queueRepository.findQueueWithEntries(
      entry.queue.id,
    );
    if (updatedQueue) {
      this.queueGateway.emitQueueUpdate(entry.queue.healthUnitId, {
        healthUnitId: entry.queue.healthUnitId,
        ticketCount: updatedQueue.ticketCount,
        entries: updatedQueue.entries.map((e) => ({
          userId: e.userId,
          position: e.position,
          status: e.status,
        })),
      });
    }

    // remove a chave de idempotência para permitir entrar de novo
    const todayKey = new Date().toISOString().split('T')[0];
    const idempotencyKey = `queue:enter:${userId}:${entry.queue.healthUnitId}:${todayKey}`;
    await this.redisService.delete(idempotencyKey);

    return cancelled;
  }
}
export { LeaveQueueUseCase };
