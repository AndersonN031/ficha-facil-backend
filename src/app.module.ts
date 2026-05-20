import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from '@shared/guards/jwt.guard';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from '@shared/guards/roles.guard';
import { UsersModule } from './modules/users/users.module';
import { HealthUnitsController } from './modules/health-units/controllers/health-units.controller';
import { HealthUnitsModule } from './modules/health-units/health-units.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({ global: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    HealthUnitsModule,
  ],
  controllers: [AppController, HealthUnitsController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
