import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersController } from './controllers/users.controller';
import { UsersRepository } from './repositories/users.repository';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersRepository],
})
export class UsersModule {}
