import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { QueueEntry } from '@prisma/client';
import { QueueRepository } from '../repositories/queue.repository';
import { HealthUnitsRepository } from '@modules/health-units/repositories/health-units.repository';

@Injectable()
class EnterQueueUseCase {
  constructor(
    private readonly queueRepository: QueueRepository,
    private readonly healthUnitsRepository: HealthUnitsRepository,
  ) {}

  async execute(
    healthUnitId: string,
    userId: string,
  ): Promise<{
    entry: QueueEntry;
    position: number;
    message: string;
  }> {
    const healthUnit = await this.healthUnitsRepository.findById(healthUnitId);
    if (!healthUnit || !healthUnit.active) {
      throw new BadRequestException('Posto de saúde não encontrado ou inativo');
    }

    this.validateOpeningHours(healthUnit.openTime, healthUnit.closeTime);

    let queue = await this.queueRepository.findTodayQueue(healthUnitId);
    if (!queue) {
      queue = await this.queueRepository.createTodayQueue(healthUnitId);
    }

    if (queue.status !== 'OPEN') {
      throw new BadRequestException('A fila está encerrada para hoje');
    }

    if (queue.ticketCount >= healthUnit.maxTicketsDay) {
      throw new BadRequestException(
        `Todas as ${healthUnit.maxTicketsDay} fichas já foram distribuídas`,
      );
    }

    const alreadyInQueue = await this.queueRepository.findEntry(
      queue.id,
      userId,
    );
    if (alreadyInQueue && alreadyInQueue.status === 'WAITING') {
      throw new ConflictException(
        `Você já está na fila na posição ${alreadyInQueue.position}`,
      );
    }

    const position = queue.ticketCount + 1;
    const entry = await this.queueRepository.createEntry({
      queueId: queue.id,
      userId,
      position,
    });

    return {
      entry,
      position,
      message: `Você entrou na fila com sucesso! Sua posição é ${position}`,
    };
  }

  private validateOpeningHours(openTime: string, closeTime: string): void {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);

    const openMinutes = openH * 60 + (openM ?? 0);
    const closeMinutes = closeH * 60 + (closeM ?? 0);

    if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
      throw new BadRequestException(
        `A fila só aceita entradas entre ${openTime} e ${closeTime}`,
      );
    }
  }
}
export { EnterQueueUseCase };
