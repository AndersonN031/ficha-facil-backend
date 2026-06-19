import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TicketsRepository } from '../repositories/tickets.repository';
import { UsersRepository } from '@modules/users/repositories/users.repository';
import { Ticket, TicketStatus } from '@prisma/client';

@Injectable()
class PatchCompleteTreatmentUseCase {
  constructor(
    private readonly ticketsRepository: TicketsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(ticketId: string, doctorId: string): Promise<Ticket> {
    const doctor = await this.usersRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundException('Médico não encontrado');
    }

    const ticket = await this.ticketsRepository.findById(ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado');
    }

    if (ticket.healthUnitId !== doctor.healthUnitId) {
      throw new ForbiddenException('Ticket não pertence ao seu posto');
    }

    if (ticket.status !== TicketStatus.IN_PROGRESS) {
      throw new ConflictException('Ticket não está em atendimento');
    }

    return this.ticketsRepository.completeTreatment(ticketId);
  }
}

export { PatchCompleteTreatmentUseCase };
