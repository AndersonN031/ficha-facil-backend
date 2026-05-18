import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createTestApp, cleanDatabase } from '../../test/helpers/setup';
import { req } from '../../test/helpers/request';

interface AuthResponseBody {
  user: {
    email: string;
    password?: string;
  };
  accessToken: string;
  refreshToken: string;
}

describe('Auth Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const setup = await createTestApp();
    app = setup.app;
    prisma = setup.prisma;
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  // ----------------------------------------------------------------
  // REGISTER
  // ----------------------------------------------------------------
  describe('POST /auth/register', () => {
    const validPayload = {
      name: 'João Silva',
      email: 'joao@email.com',
      cpf: '04512345678',
      password: '123456',
    };

    it('deve registrar um usuário com sucesso', async () => {
      const response = await req(app)
        .post('/auth/register')
        .send(validPayload)
        .expect(201);
      const body = response.body as AuthResponseBody;

      expect(body.user).toBeDefined();
      expect(body.user.email).toBe(validPayload.email);
      expect(body.user.password).toBeUndefined();
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
    });

    it('deve retornar 409 se e-mail já cadastrado', async () => {
      await req(app).post('/auth/register').send(validPayload);

      await req(app).post('/auth/register').send(validPayload).expect(409);
    });

    it('deve retornar 409 se CPF já cadastrado', async () => {
      await req(app).post('/auth/register').send(validPayload);

      await req(app)
        .post('/auth/register')
        .send({ ...validPayload, email: 'outro@email.com' })
        .expect(409);
    });

    it('deve retornar 400 se payload inválido', async () => {
      await req(app)
        .post('/auth/register')
        .send({ email: 'invalido' })
        .expect(400);
    });

    it('não deve retornar a senha do usuário', async () => {
      const response = await req(app)
        .post('/auth/register')
        .send(validPayload)
        .expect(201);
      const body = response.body as AuthResponseBody;
      expect(body.user.password).toBeUndefined();
    });
  });

  // ----------------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------------
  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await req(app).post('/auth/register').send({
        name: 'João Silva',
        email: 'joao@email.com',
        cpf: '04512345678',
        password: '123456',
      });
    });

    it('deve fazer login com sucesso', async () => {
      const response = await req(app)
        .post('/auth/login')
        .send({ email: 'joao@email.com', password: '123456' })
        .expect(200);

      const body = response.body as AuthResponseBody;
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.user.email).toBe('joao@email.com');
    });

    it('deve retornar 401 com senha errada', async () => {
      await req(app)
        .post('/auth/login')
        .send({ email: 'joao@email.com', password: 'senhaerrada' })
        .expect(401);
    });

    it('deve retornar 401 com e-mail inexistente', async () => {
      await req(app)
        .post('/auth/login')
        .send({ email: 'naoexiste@email.com', password: '123456' })
        .expect(401);
    });
  });

  // ----------------------------------------------------------------
  // REFRESH TOKEN
  // ----------------------------------------------------------------
  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const response = await req(app).post('/auth/register').send({
        name: 'João Silva',
        email: 'joao@email.com',
        cpf: '04512345678',
        password: '123456',
      });

      const body = response.body as AuthResponseBody;
      refreshToken = body.refreshToken;
    });

    it('deve gerar novos tokens com refresh token válido', async () => {
      const response = await req(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const body = response.body as AuthResponseBody;
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.refreshToken).not.toBe(refreshToken);
    });

    it('deve retornar 401 ao usar o mesmo refresh token duas vezes', async () => {
      await req(app).post('/auth/refresh').send({ refreshToken });

      await req(app).post('/auth/refresh').send({ refreshToken }).expect(401);
    });

    it('deve retornar 401 com token inválido', async () => {
      await req(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'token_invalido' })
        .expect(401);
    });
  });

  // ----------------------------------------------------------------
  // ROTA PROTEGIDA
  // ----------------------------------------------------------------
  describe('Rota protegida com JwtGuard', () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await req(app).post('/auth/register').send({
        name: 'João Silva',
        email: 'joao@email.com',
        cpf: '04512345678',
        password: '123456',
      });

      const body = response.body as AuthResponseBody;
      accessToken = body.accessToken;
    });

    it('deve retornar 401 sem token', async () => {
      await req(app).post('/auth/logout').expect(401);
    });

    it('deve acessar rota protegida com token válido', async () => {
      await req(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('deve retornar 401 com token inválido', async () => {
      await req(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer token_invalido')
        .expect(401);
    });
  });
});
