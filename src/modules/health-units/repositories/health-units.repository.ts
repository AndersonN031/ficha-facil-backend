import { Injectable } from '@nestjs/common';
import { HealthUnit, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
class HealthUnitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.HealthUnitCreateInput): Promise<HealthUnit> {
    return this.prisma.healthUnit.create({ data });
  }

  async findById(id: string): Promise<HealthUnit | null> {
    return this.prisma.healthUnit.findUnique({ where: { id } });
  }

  async findByCnes(cnes: string): Promise<HealthUnit | null> {
    return this.prisma.healthUnit.findUnique({ where: { cnes } });
  }

  async findAll(filters: {
    city?: string;
    state?: string;
    onlyActive?: boolean;
  }): Promise<HealthUnit[]> {
    return this.prisma.healthUnit.findMany({
      where: {
        ...(filters.city && {
          city: { contains: filters.city, mode: 'insensitive' },
        }),
        ...(filters.state && { state: filters.state.toUpperCase() }),
        ...(filters.onlyActive && { active: true }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async update(
    id: string,
    data: Prisma.HealthUnitUpdateInput,
  ): Promise<HealthUnit> {
    return this.prisma.healthUnit.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.healthUnit.update({
      where: { id },
      data: { active: false },
    });
  }
}

export { HealthUnitsRepository };
