import { Injectable } from '@nestjs/common';
import { QueueEntryStatus, Ticket, TicketStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
class TicketsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(ticketId: string): Promise<Ticket | null> {
    return this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });
  }

  async findTodayTicketsByHealthUnit(healthUnitId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.ticket.findMany({
      where: {
        healthUnitId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        queueEntry: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                cpf: true,
              },
            },
          },
        },
      },
      orderBy: { ticketNumber: 'asc' },
    });
  }

  async findDoctorDailyTickets(healthUnitId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);

    return this.prisma.ticket.findMany({
      where: {
        healthUnitId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        queueEntry: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                cpf: true,
              },
            },
          },
        },
      },
      orderBy: { ticketNumber: 'asc' },
    });
  }

  async findNextInQueue(healthUnitId: string): Promise<{
    queueEntryId: string;
    userId: string;
    position: number;
    queueId: string;
  } | null> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const entry = await this.prisma.queueEntry.findFirst({
      where: {
        status: QueueEntryStatus.WAITING,
        queue: {
          healthUnitId,
          date: today,
        },
      },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        userId: true,
        position: true,
        queueId: true,
      },
    });

    if (!entry) return null;

    return {
      queueEntryId: entry.id,
      userId: entry.userId,
      position: entry.position,
      queueId: entry.queueId,
    };
  }

  async createTicket(data: {
    ticketNumber: number;
    queueEntryId: string;
    healthUnitId: string;
    doctorId?: string;
  }): Promise<Ticket> {
    const [ticket] = await this.prisma.$transaction([
      this.prisma.ticket.create({
        data: {
          ticketNumber: data.ticketNumber,
          queueEntryId: data.queueEntryId,
          healthUnitId: data.healthUnitId,
          doctorId: data.doctorId ?? null,
        },
      }),
      this.prisma.queueEntry.update({
        where: { id: data.queueEntryId },
        data: { status: QueueEntryStatus.CALLED },
      }),
    ]);

    return ticket;
  }

  async startTreatment(ticketId: string): Promise<Ticket> {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: TicketStatus.IN_PROGRESS },
      include: {
        queueEntry: {
          include: {
            user: {
              select: { id: true, name: true, cpf: true },
            },
          },
        },
      },
    });
  }

  async completeTreatment(ticketId: string): Promise<Ticket> {
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.DONE },
      });

      await tx.queueEntry.update({
        where: { id: ticket.queueEntryId },
        data: { status: QueueEntryStatus.DONE },
      });

      return ticket;
    });
  }

  async countTodayTickets(healthUnitId: string): Promise<number> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.ticket.count({
      where: {
        healthUnitId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }
}

export { TicketsRepository };
