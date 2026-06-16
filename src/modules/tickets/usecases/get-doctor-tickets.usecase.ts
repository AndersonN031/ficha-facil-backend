import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketsRepository } from '../repositories/tickets.repository';
import { UsersRepository } from '@modules/users/repositories/users.repository';

@Injectable()
class GetDoctorTicketUseCase {
  constructor(
    private readonly ticketsRepository: TicketsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(doctorId: string) {
    const doctor = await this.usersRepository.findById(doctorId);
    if (!doctor?.healthUnitId) {
      throw new NotFoundException(
        'Doutor não vinculado a nenhum posto de saúde',
      );
    }

    const tickets = await this.ticketsRepository.findDoctorDailyTickets(
      doctor.healthUnitId,
    );

    return tickets;
  }
}

export { GetDoctorTicketUseCase };
