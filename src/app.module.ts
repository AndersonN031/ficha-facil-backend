import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from '@shared/guards/jwt.guard';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from '@shared/guards/roles.guard';
import { UsersModule } from './modules/users/users.module';
import { HealthUnitsModule } from './modules/health-units/health-units.module';
import { QueueModule } from '@modules/queue/queue.module';
import { RedisModule } from './config/redis.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TicketsModule } from '@modules/tickets/tickets.module';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'global', ttl: 60000, limit: 60 }],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({ global: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    HealthUnitsModule,
    QueueModule,
    RedisModule,
    TicketsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
