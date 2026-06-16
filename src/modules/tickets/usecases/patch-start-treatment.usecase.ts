import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TicketsRepository } from '../repositories/tickets.repository';
import { UsersRepository } from '@modules/users/repositories/users.repository';
import { Ticket } from '@prisma/client';

@Injectable()
class PatchStartTreatment {
  constructor(
    private readonly ticketsRepository: TicketsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(ticketId: string, doctorId: string): Promise<Ticket> {
    const doctor = await this.usersRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundException('Médico não encontrado');
    }

    const ticket =
      await this.ticketsRepository.findDoctorDailyTickets(ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado');
    }

    if (ticket.healthUnitId !== doctor.healthUnitId) {
      throw new ForbiddenException('Ticket não pertence ao seu posto');
    }

    return this.ticketsRepository.startTreatment(ticketId);
  }
}

export { PatchStartTreatment };
