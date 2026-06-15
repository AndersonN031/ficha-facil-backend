import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TicketsRepository } from '../repositories/tickets.repository';
import { QueueRepository } from '@modules/queue/repositories/queue.repository';
import { UsersRepository } from '@modules/users/repositories/users.repository';
import { RedisService } from 'src/config/redis.config';
import { QueueGateway } from '@modules/queue/gateway/queue.gateway';
import { Ticket } from '@prisma/client';
import { NotificationsService } from '@modules/notifications/notifications.service';

@Injectable()
class CallNextUseCase {
  constructor(
    private readonly ticketsRepository: TicketsRepository,
    private readonly queueRepository: QueueRepository,
    private readonly usersRepository: UsersRepository,
    private readonly redisService: RedisService,
    private readonly queueGateway: QueueGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async execute(receptionistId: string): Promise<Ticket> {
    // 1. busca a recepcionista e verifica se está vinculada a um posto
    const receptionist = await this.usersRepository.findById(receptionistId);
    if (!receptionist?.healthUnitId) {
      throw new ForbiddenException(
        'Recepcionista não está vinculada a nenhum posto de saúde',
      );
    }

    const healthUnitId = receptionist.healthUnitId;

    // 2. busca o próximo da fila
    const next = await this.ticketsRepository.findNextInQueue(healthUnitId);
    if (!next) {
      throw new NotFoundException('Não há pacientes aguardando na fila');
    }

    // 3. gera o número sequencial do dia
    const todayCount =
      await this.ticketsRepository.countTodayTickets(healthUnitId);
    const ticketNumber = todayCount + 1;

    // 4. cria o ticket e muda QueueEntry para CALLED atomicamente
    const ticket = await this.ticketsRepository.createTicket({
      ticketNumber,
      queueEntryId: next.queueEntryId,
      healthUnitId,
    });

    // 5. invalida o cache da fila — checklist da task anterior
    await this.redisService.delete(`queue:${healthUnitId}`);

    // 6. emite atualização da fila para todos do posto via Socket.io
    const updatedQueue = await this.queueRepository.findQueueWithEntries(
      next.queueId,
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

    // 7. emite notificação específica para o paciente chamado
    await this.notificationsService.notifyPatientCalled({
      healthUnitId,
      userId: next.userId,
      ticketNumber: ticket.ticketNumber,
      position: next.position,
      message: `Sua ficha de número ${ticketNumber} foi chamada! Dirija-se à recepção.`,
    });

    return ticket;
  }
}

export { CallNextUseCase };
