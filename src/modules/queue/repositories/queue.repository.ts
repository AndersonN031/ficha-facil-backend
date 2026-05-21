import { Injectable } from '@nestjs/common';
import {
  Queue,
  QueueEntry,
  QueueEntryStatus,
  QueueStatus,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
class QueueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTodayQueue(healthUnitId: string): Promise<Queue | null> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return this.prisma.queue.findUnique({
      where: {
        healthUnitId_date: {
          healthUnitId,
          date: today,
        },
      },
    });
  }

  async createTodayQueue(healthUnitId: string): Promise<Queue> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return this.prisma.queue.create({
      data: {
        healthUnitId,
        date: today,
        status: QueueStatus.OPEN,
        ticketCount: 0,
      },
    });
  }

  async findEntry(queueId: string, userId: string): Promise<QueueEntry | null> {
    return this.prisma.queueEntry.findUnique({
      where: {
        queueId_userId: {
          queueId,
          userId,
        },
      },
    });
  }

  async findEntryById(entryId: string): Promise<QueueEntry | null> {
    return this.prisma.queueEntry.findUnique({
      where: { id: entryId },
    });
  }

  async createEntry(data: {
    queueId: string;
    userId: string;
    position: number;
  }): Promise<QueueEntry> {
    const [entry] = await this.prisma.$transaction([
      this.prisma.queueEntry.create({
        data: {
          queueId: data.queueId,
          userId: data.userId,
          position: data.position,
          status: QueueEntryStatus.WAITING,
        },
      }),
      // incrementa o contador de fichas da fila atomicamente
      this.prisma.queue.update({
        where: { id: data.queueId },
        data: { ticketCount: { increment: 1 } },
      }),
    ]);

    return entry;
  }

  async cancelEntry(entryId: string): Promise<QueueEntry> {
    return this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: QueueEntryStatus.CANCELLED },
    });
  }

  async findQueueWithEntries(queueId: string) {
    return this.prisma.queue.findUnique({
      where: { id: queueId },
      include: {
        entries: {
          where: { status: QueueEntryStatus.WAITING },
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async deleteEntry(entryId: string): Promise<void> {
    await this.prisma.queueEntry.delete({ where: { id: entryId } });
  }
}

export { QueueRepository };
