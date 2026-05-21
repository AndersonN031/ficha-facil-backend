import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueueRepository } from '../repositories/queue.repository';
import { QueueEntry } from '@prisma/client';

@Injectable()
class LeaveQueueUseCase {
  constructor(private readonly queueRepository: QueueRepository) {}

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

    return this.queueRepository.cancelEntry(entryId);
  }
}
export { LeaveQueueUseCase };
