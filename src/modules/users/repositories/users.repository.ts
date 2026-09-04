import { Injectable } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

interface UpdateUserData {
  name?: string;
  phone?: string;
  password?: string;
}

@Injectable()
class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllUsers(healthUnitId: string) {
    return this.prisma.user.findMany({
      where: { healthUnitId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        healthUnitId: true,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async manageUser(
    id: string,
    data: { role?: Role; healthUnitId?: string | null; active?: boolean },
  ): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }
}

export { UsersRepository };
