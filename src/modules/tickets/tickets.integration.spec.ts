import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createTestApp, cleanDatabase } from '../../test/helpers/setup';
import { req } from '../../test/helpers/request';

interface AuthResponseBody {
  accessToken: string;
  user: { id: string; email: string; role: string };
}

interface TicketResponseBody {
  id: string;
  ticketNumber: number;
  status: string;
  queueEntry: {
    user: { id: string; name: string; cpf: string };
  };
}

describe('Tickets Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let patientToken: string;
  let doctorToken: string;
  let unitId: string;
  let ticketId: string;

  beforeAll(async () => {
    const setup = await createTestApp();
    app = setup.app;
    prisma = setup.prisma;
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);

    // registra paciente
    const patientRes = await req(app).post('/auth/register').send({
      name: 'João Paciente',
      email: 'joao@email.com',
      cpf: '04512345678',
      password: '123456',
    });
    patientToken = (patientRes.body as AuthResponseBody).accessToken;

    // registra médico (começa como PATIENT)
    const doctorRes = await req(app).post('/auth/register').send({
      name: 'Dra. Ana',
      email: 'ana@email.com',
      cpf: '98765432100',
      password: '123456',
    });
    const doctorId = (doctorRes.body as AuthResponseBody).user.id;

    // promove primeiro usuário para ADMIN para criar o posto
    await prisma.user.update({
      where: { email: 'joao@email.com' },
      data: { role: 'ADMIN' },
    });

    const adminLoginRes = await req(app)
      .post('/auth/login')
      .send({ email: 'joao@email.com', password: '123456' });
    const adminToken = (adminLoginRes.body as AuthResponseBody).accessToken;

    // cria o posto
    const unitRes = await req(app)
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
    unitId = (unitRes.body as { id: string }).id;

    // volta paciente para PATIENT e vincula médico ao posto
    await prisma.user.update({
      where: { email: 'joao@email.com' },
      data: { role: 'PATIENT' },
    });

    await prisma.user.update({
      where: { id: doctorId },
      data: { role: 'DOCTOR', healthUnitId: unitId },
    });

    // pega tokens atualizados
    const patientLoginRes = await req(app)
      .post('/auth/login')
      .send({ email: 'joao@email.com', password: '123456' });
    patientToken = (patientLoginRes.body as AuthResponseBody).accessToken;

    const doctorLoginRes = await req(app)
      .post('/auth/login')
      .send({ email: 'ana@email.com', password: '123456' });
    doctorToken = (doctorLoginRes.body as AuthResponseBody).accessToken;

    // paciente entra na fila
    await req(app)
      .post(`/queue/${unitId}/enter`)
      .set('Authorization', `Bearer ${patientToken}`);

    // recepcionista chama próximo (promove paciente temporariamente)
    await prisma.user.update({
      where: { email: 'joao@email.com' },
      data: { role: 'RECEPTIONIST', healthUnitId: unitId },
    });

    const receptionistLoginRes = await req(app)
      .post('/auth/login')
      .send({ email: 'joao@email.com', password: '123456' });
    const receptionistToken = (receptionistLoginRes.body as AuthResponseBody)
      .accessToken;

    const ticketRes = await req(app)
      .post('/tickets/call-next')
      .set('Authorization', `Bearer ${receptionistToken}`);
    ticketId = (ticketRes.body as TicketResponseBody).id;

    // volta paciente para PATIENT
    await prisma.user.update({
      where: { email: 'joao@email.com' },
      data: { role: 'PATIENT', healthUnitId: null },
    });
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  // ----------------------------------------------------------------
  // GET /tickets/doctor/today
  // ----------------------------------------------------------------
  describe('GET /tickets/doctor/today', () => {
    it('deve listar fichas do dia do posto do médico', async () => {
      const response = await req(app)
        .get('/tickets/doctor/today')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const body = response.body as TicketResponseBody[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(1);
      expect(body[0].queueEntry.user.name).toBe('João Paciente');
    });

    it('deve retornar 401 sem token', async () => {
      await req(app).get('/tickets/doctor/today').expect(401);
    });

    it('deve retornar 403 para PATIENT', async () => {
      await req(app)
        .get('/tickets/doctor/today')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);
    });
  });

  // ----------------------------------------------------------------
  // PATCH /tickets/:id/start
  // ----------------------------------------------------------------
  describe('PATCH /tickets/:id/start', () => {
    it('deve iniciar atendimento e mudar status para IN_PROGRESS', async () => {
      const response = await req(app)
        .patch(`/tickets/${ticketId}/start`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const body = response.body as TicketResponseBody;
      expect(body.status).toBe('IN_PROGRESS');
      expect(body.queueEntry.user.name).toBe('João Paciente');
    });

    it('deve retornar 409 ao tentar iniciar ticket já IN_PROGRESS', async () => {
      await req(app)
        .patch(`/tickets/${ticketId}/start`)
        .set('Authorization', `Bearer ${doctorToken}`);

      await req(app)
        .patch(`/tickets/${ticketId}/start`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(409);
    });

    it('deve retornar 401 sem token', async () => {
      await req(app).patch(`/tickets/${ticketId}/start`).expect(401);
    });

    it('deve retornar 403 para PATIENT', async () => {
      await req(app)
        .patch(`/tickets/${ticketId}/start`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);
    });
  });

  // ----------------------------------------------------------------
  // PATCH /tickets/:id/complete
  // ----------------------------------------------------------------
  describe('PATCH /tickets/:id/complete', () => {
    it('deve concluir atendimento e mudar status para DONE', async () => {
      // precisa estar IN_PROGRESS primeiro
      await req(app)
        .patch(`/tickets/${ticketId}/start`)
        .set('Authorization', `Bearer ${doctorToken}`);

      const response = await req(app)
        .patch(`/tickets/${ticketId}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const body = response.body as TicketResponseBody;
      expect(body.status).toBe('DONE');
    });

    it('deve retornar 409 ao tentar concluir ticket WAITING', async () => {
      await req(app)
        .patch(`/tickets/${ticketId}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(409);
    });

    it('deve retornar 409 ao tentar voltar para IN_PROGRESS após DONE', async () => {
      await req(app)
        .patch(`/tickets/${ticketId}/start`)
        .set('Authorization', `Bearer ${doctorToken}`);

      await req(app)
        .patch(`/tickets/${ticketId}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`);

      await req(app)
        .patch(`/tickets/${ticketId}/start`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(409);
    });

    it('deve retornar 401 sem token', async () => {
      await req(app).patch(`/tickets/${ticketId}/complete`).expect(401);
    });

    it('deve retornar 403 para PATIENT', async () => {
      await req(app)
        .patch(`/tickets/${ticketId}/complete`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);
    });
  });
});
