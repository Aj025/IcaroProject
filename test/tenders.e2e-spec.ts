import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthGuard } from '../src/common/guards/auth.guard.js';
import { PermissionsGuard } from '../src/common/guards/permissions.guard.js';
import { N8nSecretGuard } from '../src/common/guards/n8n-secret.guard.js';
import { TendersModule } from '../src/modules/tenders/tenders.module.js';

const mockPrisma = {
  tender: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  profile: {
    findUnique: jest.fn(),
  },
};

const mockPrismaService = {
  prisma: mockPrisma,
};

describe('Tenders (e2e)', () => {
  let app: INestApplication;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'estimator',
    permissions: { Tenders: true, Financials: false },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ ignoreEnvFile: true, isGlobal: true }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 1000 }]),
        TendersModule,
      ],
      providers: [
        { provide: AuthGuard, useValue: { canActivate: jest.fn(() => true) } },
        {
          provide: PermissionsGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
      ],
    })
      .overrideProvider('PrismaService')
      .useValue(mockPrismaService)
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /tenders', () => {
    it('returns 400 when required fields are missing', () => {
      return request(app.getHttpServer())
        .post('/tenders')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
        });
    });

    it('returns 400 when contractSum is negative', () => {
      return request(app.getHttpServer())
        .post('/tenders')
        .send({
          client: 'Test',
          job: 'Test job',
          received: '2026-07-01T00:00:00.000Z',
          due: '2026-07-15T00:00:00.000Z',
          contractSum: -100,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
        });
    });

    it('returns 201 when data is valid', () => {
      mockPrisma.tender.create.mockResolvedValue({
        id: 'new-id',
        client: 'Test Client',
        job: 'Test job',
        received: new Date('2026-07-01'),
        due: new Date('2026-07-15'),
        status: 'Pricing',
        contractSum: null,
        isSigned: false,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return request(app.getHttpServer())
        .post('/tenders')
        .send({
          client: 'Test Client',
          job: 'Test job',
          received: '2026-07-01T00:00:00.000Z',
          due: '2026-07-15T00:00:00.000Z',
        })
        .expect(201);
    });
  });

  describe('n8n endpoints', () => {
    it('rejects intake request without X-N8N-Secret', () => {
      return request(app.getHttpServer())
        .post('/integrations/tenders/intake')
        .send({
          sourceEmailId: 'test',
          subject: 'test',
          body: 'test',
          receivedDate: '2026-07-01',
        })
        .expect(401);
    });

    it('rejects pending-estimates without X-N8N-Secret', () => {
      return request(app.getHttpServer())
        .get('/integrations/tenders/pending-estimates')
        .expect(401);
    });
  });

  describe('DELETE /tenders/:id', () => {
    it('returns 409 when tender is signed', () => {
      mockPrisma.tender.findUnique.mockResolvedValue({
        id: 'signed-tender',
        isSigned: true,
        isDeleted: false,
        client: 'Test',
        job: 'Test',
        received: new Date(),
        due: new Date(),
        status: 'Won',
        contractSum: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return request(app.getHttpServer())
        .delete('/tenders/signed-tender')
        .expect(409);
    });

    it('returns 200 when soft-deleting an unsigned tender', () => {
      mockPrisma.tender.findUnique.mockResolvedValue({
        id: 'unsigned-tender',
        isSigned: false,
        isDeleted: false,
        client: 'Test',
        job: 'Test',
        received: new Date(),
        due: new Date(),
        status: 'Pricing',
        contractSum: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.tender.update.mockResolvedValue({
        id: 'unsigned-tender',
        isSigned: false,
        isDeleted: true,
        deletedAt: new Date(),
        client: 'Test',
        job: 'Test',
        received: new Date(),
        due: new Date(),
        status: 'Pricing',
        contractSum: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return request(app.getHttpServer())
        .delete('/tenders/unsigned-tender')
        .expect(200);
    });
  });

  describe('PATCH /tenders/:id/status', () => {
    it('returns 400 for invalid status value', () => {
      mockPrisma.tender.findUnique.mockResolvedValue({
        id: 'tender-1',
        status: 'Pricing',
        isSigned: false,
        client: 'Test',
        job: 'Test',
        received: new Date(),
        due: new Date(),
        contractSum: null,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return request(app.getHttpServer())
        .patch('/tenders/tender-1/status')
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });
  });
});
