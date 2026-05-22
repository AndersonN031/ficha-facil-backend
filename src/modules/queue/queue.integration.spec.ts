import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createTestApp, cleanDatabase } from '../../test/helpers/setup';
import { req } from '../../test/helpers/request';

interface AuthResponseBody {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

interface EnterQueueResponseBody {
  entry: {
    id: string;
    position: number;
    status: string;
  };
  position: number;
  message: string;
}

interface HealthUnitResponseBody {
  id: string;
  name: string;
}

describe('Queue Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let unitId: string;

  beforeAll(async () => {
    const setup = await createTestApp();
    app = setup.app;
    prisma = setup.prisma;
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);

    // registra o usuário
    const registerResponse = await req(app).post('/auth/register').send({
      name: 'João Silva',
      email: 'joao@email.com',
      cpf: '04512345678',
      password: '123456',
    });

    const registerBody = registerResponse.body as AuthResponseBody;
    accessToken = registerBody.accessToken;

    // promove para ADMIN para criar o posto
    await prisma.user.update({
      where: { email: 'joao@email.com' },
      data: { role: 'ADMIN' },
    });

    // precisa de um novo token com role ADMIN
    const loginAdminResponse = await req(app)
      .post('/auth/login')
      .send({ email: 'joao@email.com', password: '123456' });

    const loginAdminBody = loginAdminResponse.body as AuthResponseBody;
    const adminToken = loginAdminBody.accessToken;

    // cria o posto
    const unitResponse = await req(app)
      .post('/health-units')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'UBS Vila União',
        address: 'Rua das Flores, 123',
        city: 'Caruaru',
        state: 'PE',
        maxTicketsDay: 30,
        openTime: '00:00',
        closeTime: '23:59',
      });

    const unitBody = unitResponse.body as HealthUnitResponseBody;
    unitId = unitBody.id;

    // volta para PATIENT e pega token atualizado
    await prisma.user.update({
      where: { email: 'joao@email.com' },
      data: { role: 'PATIENT' },
    });

    const loginPatientResponse = await req(app)
      .post('/auth/login')
      .send({ email: 'joao@email.com', password: '123456' });

    const loginPatientBody = loginPatientResponse.body as AuthResponseBody;
    accessToken = loginPatientBody.accessToken;
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  // ----------------------------------------------------------------
  // ENTRAR NA FILA
  // ----------------------------------------------------------------
  describe('POST /queue/:unitId/enter', () => {
    it('deve entrar na fila com sucesso', async () => {
      const response = await req(app)
        .post(`/queue/${unitId}/enter`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      const body = response.body as EnterQueueResponseBody;
      expect(body.position).toBe(1);
      expect(body.entry).toBeDefined();
      expect(body.entry.status).toBe('WAITING');
    });

    it('deve retornar 409 se já está na fila', async () => {
      await req(app)
        .post(`/queue/${unitId}/enter`)
        .set('Authorization', `Bearer ${accessToken}`);

      await req(app)
        .post(`/queue/${unitId}/enter`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(409);
    });

    it('deve retornar 401 sem token', async () => {
      await req(app).post(`/queue/${unitId}/enter`).expect(401);
    });

    it('deve bloquear requests simultâneas — idempotência', async () => {
      const [result1, result2] = await Promise.all([
        req(app)
          .post(`/queue/${unitId}/enter`)
          .set('Authorization', `Bearer ${accessToken}`),
        req(app)
          .post(`/queue/${unitId}/enter`)
          .set('Authorization', `Bearer ${accessToken}`),
      ]);

      const statuses = [result1.status, result2.status];
      expect(statuses).toContain(201);
      expect(statuses).toContain(409);
    });
  });

  // ----------------------------------------------------------------
  // SAIR DA FILA
  // ----------------------------------------------------------------
  describe('DELETE /queue/:entryId', () => {
    it('deve cancelar a entrada na fila com sucesso', async () => {
      const enterResponse = await req(app)
        .post(`/queue/${unitId}/enter`)
        .set('Authorization', `Bearer ${accessToken}`);

      const enterBody = enterResponse.body as EnterQueueResponseBody;
      const entryId = enterBody.entry.id;

      const response = await req(app)
        .delete(`/queue/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as { status: string };
      expect(body.status).toBe('CANCELLED');
    });

    it('deve retornar 403 ao tentar cancelar entrada de outro usuário', async () => {
      const enterResponse = await req(app)
        .post(`/queue/${unitId}/enter`)
        .set('Authorization', `Bearer ${accessToken}`);

      const enterBody = enterResponse.body as EnterQueueResponseBody;
      const entryId = enterBody.entry.id;

      // registra segundo paciente
      const register2Response = await req(app).post('/auth/register').send({
        name: 'Maria Silva',
        email: 'maria@email.com',
        cpf: '12345678901',
        password: '123456',
      });

      const register2Body = register2Response.body as AuthResponseBody;

      await req(app)
        .delete(`/queue/${entryId}`)
        .set('Authorization', `Bearer ${register2Body.accessToken}`)
        .expect(403);
    });

    it('deve permitir entrar de novo após cancelar', async () => {
      const enterResponse = await req(app)
        .post(`/queue/${unitId}/enter`)
        .set('Authorization', `Bearer ${accessToken}`);

      const enterBody = enterResponse.body as EnterQueueResponseBody;
      const entryId = enterBody.entry.id;

      await req(app)
        .delete(`/queue/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      await req(app)
        .post(`/queue/${unitId}/enter`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);
    });
  });
});
