import { Injectable } from '@nestjs/common';
import { QueueEntryStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getDayRange(date: Date) {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setUTCHours(24, 0, 0, 0);
    return { start, end };
  }

  async getDailyMetrics(healthUnitId: string, date: Date) {
    const { start, end } = this.getDayRange(date);

    const [tickets, cancellations] = await Promise.all([
      this.prisma.ticket.findMany({
        where: {
          healthUnitId,
          createdAt: { gte: start, lt: end },
        },
        include: {
          queueEntry: {
            select: { createdAt: true },
          },
          doctor: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.queueEntry.count({
        where: {
          status: QueueEntryStatus.CANCELLED,
          queue: {
            healthUnitId,
            date: start,
          },
        },
      }),
    ]);

    return { tickets, cancellations };
  }
}
