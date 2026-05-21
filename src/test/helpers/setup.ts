import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();

  const prisma = moduleFixture.get<PrismaService>(PrismaService);

  return { app, prisma };
}

export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.queueEntry.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.healthUnit.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}
