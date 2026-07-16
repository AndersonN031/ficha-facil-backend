import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketStatus, User } from '@prisma/client';
import { RedisService } from 'src/config/redis.config';
import { ReportsRepository } from '../repositories/reports.repository';
import { UsersRepository } from '@modules/users/repositories/users.repository';

@Injectable()
export class GetDailyReportUseCase {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly redisService: RedisService,
    private readonly userRepository: UsersRepository,
  ) {}

  async execute(adminId: string, dateStr: string) {
    const admin =
      ((await this.userRepository.findById(adminId)) as User) || null;
    if (!admin?.healthUnitId) {
      throw new NotFoundException('Admin não está vinculado a um posto');
    }

    const cacheKey = `reports:daily:${admin.healthUnitId}:${dateStr}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as unknown;
    }

    const date = new Date(dateStr);
    const { tickets, cancellations } =
      await this.reportsRepository.getDailyMetrics(admin.healthUnitId, date);

    // total de fichas emitidas
    const totalTickets = tickets.length;

    // tempo médio de espera (ticket.createdAt - queueEntry.createdAt)
    const completedTickets = tickets.filter(
      (t) => t.status === TicketStatus.DONE,
    );

    const avgWaitMinutes =
      completedTickets.length > 0
        ? Math.round(
            completedTickets.reduce((acc, t) => {
              const waitMs =
                t.createdAt.getTime() - t.queueEntry.createdAt.getTime();
              return acc + waitMs;
            }, 0) /
              completedTickets.length /
              1000 /
              60,
          )
        : 0;

    // atendimentos por médico
    const byDoctor = completedTickets.reduce<
      Record<string, { name: string; count: number }>
    >((acc, t) => {
      if (!t.doctorId || !t.doctor) return acc;
      if (!acc[t.doctorId]) {
        acc[t.doctorId] = { name: t.doctor.name, count: 0 };
      }
      acc[t.doctorId].count++;
      return acc;
    }, {});

    const report = {
      date: dateStr,
      totalTickets,
      completedTickets: completedTickets.length,
      cancellations,
      avgWaitMinutes,
      byDoctor: Object.values(byDoctor),
    };

    await this.redisService.set(cacheKey, JSON.stringify(report), 60);

    return report;
  }
}
