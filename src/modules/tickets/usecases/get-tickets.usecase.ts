import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketsRepository } from '../repositories/tickets.repository';
import { UsersRepository } from '@modules/users/repositories/users.repository';

@Injectable()
class GetTicketsUseCase {
  constructor(
    private readonly ticketsRepository: TicketsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(recepcionistId: string) {
    const receptionist = await this.usersRepository.findById(recepcionistId);
    if (!receptionist?.healthUnitId) {
      throw new NotFoundException(
        'Recepcionista não está vinculada a nenhum posto de saúde',
      );
    }

    const tickets = await this.ticketsRepository.findTodayTicketsByHealthUnit(
      receptionist.healthUnitId,
    );

    return tickets;
  }
}

export { GetTicketsUseCase };
