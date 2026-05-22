import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { QueueEntry } from '@prisma/client';
import { QueueRepository } from '../repositories/queue.repository';
import { HealthUnitsRepository } from '@modules/health-units/repositories/health-units.repository';
import { RedisService } from 'src/config/redis.config';
import { QueueGateway } from '../gateway/queue.gateway';

@Injectable()
class EnterQueueUseCase {
  constructor(
    private readonly queueRepository: QueueRepository,
    private readonly healthUnitsRepository: HealthUnitsRepository,
    private readonly redisService: RedisService,
    private readonly queueGateway: QueueGateway,
  ) {}

  async execute(
    healthUnitId: string,
    userId: string,
  ): Promise<{
    entry: QueueEntry;
    position: number;
    message: string;
  }> {
    // 0. idempotência - bloqueia requests duplicadas
    const idempotencyKey = `queue:enter:${userId}:${healthUnitId}:${this.todayKey()}`;
    const isFirstRequest = await this.redisService.setIfNotExists(
      idempotencyKey,
      30,
    );

    if (!isFirstRequest) {
      throw new ConflictException(
        'Requisição duplicada detectada. Aguarde alguns segundos e tente novamente',
      );
    }

    try {
      // 1. verifica se o posto existe e está ativo
      const healthUnit =
        await this.healthUnitsRepository.findById(healthUnitId);
      if (!healthUnit || !healthUnit.active) {
        throw new BadRequestException(
          'Posto de saúde não encontrado ou inativo',
        );
      }

      // 2. verifica se está no horário de funcionamento
      this.validateOpeningHours(healthUnit.openTime, healthUnit.closeTime);

      // 3. busca ou cria a fila de hoje
      let queue = await this.queueRepository.findTodayQueue(healthUnitId);
      if (!queue) {
        queue = await this.queueRepository.createTodayQueue(healthUnitId);
      }

      // 4. verifica se a fila está aberta
      if (queue.status !== 'OPEN') {
        throw new BadRequestException('A fila está encerrada para hoje');
      }

      // 5. verifica se ainda tem vagas
      if (queue.ticketCount >= healthUnit.maxTicketsDay) {
        throw new BadRequestException(
          `Todas as ${healthUnit.maxTicketsDay} fichas já foram distribuídas`,
        );
      }

      // 6. verifica se o paciente já tem uma entrada nessa fila
      const existingEntry = await this.queueRepository.findEntry(
        queue.id,
        userId,
      );

      if (existingEntry) {
        switch (existingEntry.status) {
          case 'WAITING':
            throw new ConflictException(
              `Você já está na fila na posição ${existingEntry.position}`,
            );
          case 'CALLED':
            throw new ConflictException('Você já foi chamado para atendimento');
          case 'DONE':
            throw new BadRequestException(
              'Você já foi atendido hoje neste posto',
            );
          case 'CANCELLED':
            await this.queueRepository.deleteEntry(existingEntry.id);
            break;
        }
      }

      // 7. define a próxima posição e cria a entry
      const position = queue.ticketCount + 1;
      const entry = await this.queueRepository.createEntry({
        queueId: queue.id,
        userId,
        position,
      });

      // 8. emite atualização para todos conectados no posto
      const updatedQueue = await this.queueRepository.findQueueWithEntries(
        queue.id,
      );
      if (updatedQueue) {
        this.queueGateway.emitQueueUpdate(healthUnitId, {
          healthUnitId,
          ticketCount: updatedQueue.ticketCount,
          entries: updatedQueue.entries.map((e) => ({
            userId: e.userId,
            position: e.position,
            status: e.status,
          })),
        });
      }

      return {
        entry,
        position,
        message: `Você entrou na fila com sucesso! Sua posição é ${position}`,
      };
    } catch (error) {
      await this.redisService.delete(idempotencyKey);
      throw error;
    }
  }

  private todayKey(): string {
    return new Date().toISOString().split('T')[0];
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
