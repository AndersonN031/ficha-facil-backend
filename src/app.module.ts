import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './config/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthUnitsModule } from './modules/health-units/health-units.module';
import { QueueModule } from './modules/queue/queue.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from './shared/guards/jwt.guard';
import { RolesGuard } from './shared/guards/roles.guard';
import { BullModule } from '@nestjs/bullmq';
import { IncomingMessage, ServerResponse } from 'http';
import { HealthController } from '@modules/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : process.env.NODE_ENV === 'test'
            ? '.env.test'
            : '.env',
    }),

    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get('NODE_ENV') === 'production';

        return {
          pinoHttp: {
            transport: isProd
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: { colorize: true, singleLine: true },
                },

            customProps: (
              req: IncomingMessage & { user?: { sub: string } },
            ) => ({
              userId: req.user?.sub ?? 'anonymous',
            }),

            customSuccessMessage: (
              req: IncomingMessage,
              res: ServerResponse,
            ) => {
              return `${req.method} ${req.url} ${res.statusCode}`;
            },

            customErrorMessage: (
              req: IncomingMessage,
              res: ServerResponse,
              err: Error,
            ) => {
              return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
            },

            autoLogging: {
              ignore: (req: IncomingMessage) => req.url === '/health',
            },

            level: isProd ? 'info' : 'debug',
          },
        };
      },
    }),

    JwtModule.register({ global: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
          password: config.get<string>('REDIS_PASSWORD'),
        },
      }),
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    HealthUnitsModule,
    QueueModule,
    TicketsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
