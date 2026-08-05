jest.mock('../../prisma/prisma.service.js', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    prisma: {
      emailTemplate: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    },
  })),
}));

import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CommunicationService } from './communication.service.js';
import { MailService } from './mail.service.js';
import type { SendEmailDto } from './dto/communication.dto.js';
import type { SentEmailResponse } from './dto/email-template-response.dto.js';

interface EmailTemplateRow {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  subject: string;
  body: string;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const mockRow = (
  overrides: Partial<EmailTemplateRow> = {},
): EmailTemplateRow => ({
  id: 'tpl-1',
  tenantId: 'default',
  key: 'quotation_to_estimator',
  name: 'Quotation request — estimator',
  subject: 'Estimate needed: {job} — {client}',
  body: 'Hi {estimatorName}, please quote the {job}.',
  updatedById: null,
  createdAt: new Date('2026-07-01'),
  updatedAt: new Date('2026-07-01'),
  ...overrides,
});

type DbMock = {
  emailTemplate: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    upsert: jest.Mock;
    delete: jest.Mock;
  };
  auditLog: {
    create: jest.Mock;
  };
};

describe('CommunicationService', () => {
  let service: CommunicationService;
  let db: DbMock;
  let mailService: MailService;
  let send: jest.Mock<Promise<SentEmailResponse>, [SendEmailDto]>;

  beforeEach(() => {
    const prisma = new PrismaService();
    db = prisma.prisma as unknown as DbMock;
    send = jest.fn<Promise<SentEmailResponse>, [SendEmailDto]>();
    mailService = { send } as unknown as MailService;
    service = new CommunicationService(prisma, mailService);
    jest.clearAllMocks();
  });

  describe('getTemplate', () => {
    it('returns the default definition when no DB row exists', async () => {
      db.emailTemplate.findUnique.mockResolvedValue(null);
      const result = await service.getTemplate('quotation_to_estimator');
      expect(result.isDefault).toBe(true);
      expect(result.subject).toContain('{job}');
      expect(db.emailTemplate.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId_key: {
              tenantId: 'default',
              key: 'quotation_to_estimator',
            },
          },
        }),
      );
    });

    it('returns the DB row when one exists', async () => {
      db.emailTemplate.findUnique.mockResolvedValue(
        mockRow({
          subject: 'Custom subject',
          updatedAt: new Date('2026-08-01'),
        }),
      );
      const result = await service.getTemplate('quotation_to_estimator');
      expect(result.subject).toBe('Custom subject');
      expect(result.isDefault).toBe(false);
      expect(result.updatedAt?.toISOString()).toBe('2026-08-01T00:00:00.000Z');
    });

    it('throws NotFoundException for unknown key', async () => {
      await expect(service.getTemplate('bogus')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listTemplates', () => {
    it('returns both defaults when no rows exist', async () => {
      db.emailTemplate.findMany.mockResolvedValue([]);
      const result = await service.listTemplates();
      expect(result.templates).toHaveLength(2);
      for (const t of result.templates) {
        expect(t.isDefault).toBe(true);
      }
    });

    it('overrides defaults with saved rows', async () => {
      db.emailTemplate.findMany.mockResolvedValue([
        mockRow({ subject: 'Custom estimator subject' }),
      ]);
      const result = await service.listTemplates();
      const estimator = result.templates.find(
        (t) => t.key === 'quotation_to_estimator',
      );
      const client = result.templates.find(
        (t) => t.key === 'quotation_to_client',
      );
      expect(estimator?.subject).toBe('Custom estimator subject');
      expect(estimator?.isDefault).toBe(false);
      expect(client?.isDefault).toBe(true);
    });
  });

  describe('updateTemplate', () => {
    it('upserts subject/body and returns the saved template', async () => {
      db.emailTemplate.upsert.mockResolvedValue(
        mockRow({ subject: 'New subject', body: 'New body' }),
      );
      db.emailTemplate.findUnique.mockResolvedValue(
        mockRow({ subject: 'New subject', body: 'New body' }),
      );
      const result = await service.updateTemplate(
        'quotation_to_estimator',
        { subject: 'New subject', body: 'New body' },
        'user-1',
      );
      expect(db.emailTemplate.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId_key: {
              tenantId: 'default',
              key: 'quotation_to_estimator',
            },
          },
          create: expect.objectContaining({
            subject: 'New subject',
            updatedById: 'user-1',
          }) as object,
          update: expect.objectContaining({
            subject: 'New subject',
            body: 'New body',
          }) as object,
        }),
      );
      expect(result.subject).toBe('New subject');
      expect(result.isDefault).toBe(false);
    });
  });

  describe('resetTemplate', () => {
    it('deletes the row and returns the default with reset: true', async () => {
      db.emailTemplate.findUnique.mockResolvedValue(
        mockRow({ subject: 'Custom' }),
      );
      db.emailTemplate.delete.mockResolvedValue({});
      db.auditLog.create.mockResolvedValue({});
      const result = await service.resetTemplate(
        'quotation_to_estimator',
        'user-1',
      );
      expect(db.emailTemplate.delete).toHaveBeenCalledWith({
        where: { id: 'tpl-1' },
      });
      expect(db.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: 'EmailTemplate',
            field: 'reset',
            changedById: 'user-1',
          }) as object,
        }),
      );
      expect(result.reset).toBe(true);
      expect(result.isDefault).toBe(true);
    });

    it('no-ops without audit when no row exists', async () => {
      db.emailTemplate.findUnique.mockResolvedValue(null);
      const result = await service.resetTemplate(
        'quotation_to_estimator',
        'user-1',
      );
      expect(db.emailTemplate.delete).not.toHaveBeenCalled();
      expect(db.auditLog.create).not.toHaveBeenCalled();
      expect(result.reset).toBe(true);
    });
  });

  describe('sendEmail', () => {
    it('resolves a template, substitutes placeholders and sends via mail', async () => {
      db.emailTemplate.findUnique.mockResolvedValue(null);
      send.mockResolvedValue({
        sent: true,
        messageId: 'm-1',
        recipient: 'estimator@icaro.com',
        accepted: ['estimator@icaro.com'],
        rejected: [],
      });

      const result = await service.sendEmail({
        to: 'estimator@icaro.com',
        templateKey: 'quotation_to_estimator',
        data: {
          estimatorName: 'Maria',
          job: 'Foundation pour',
          client: 'Acme Corp',
          due: '2026-08-15',
          companyName: 'Icaro Projects',
        },
      });

      const payload = send.mock.calls[0]?.[0];
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'estimator@icaro.com',
          subject: 'Estimate needed: Foundation pour — Acme Corp',
        }),
      );
      expect(payload.body).toContain('Hi Maria,');
      expect(result).toEqual(
        expect.objectContaining({
          sent: true,
          messageId: 'm-1',
          recipient: 'estimator@icaro.com',
        }),
      );
    });

    it('uses raw subject/body when provided without a template', async () => {
      send.mockResolvedValue({
        sent: true,
        messageId: null,
        recipient: 'client@acme.com',
        accepted: ['client@acme.com'],
        rejected: [],
      });

      await service.sendEmail({
        to: 'client@acme.com',
        subject: 'Hi {name}',
        body: 'Body line one\nBody line two',
        data: { name: 'Rob' },
      });

      const payload = send.mock.calls[0]?.[0];
      expect(payload.subject).toBe('Hi Rob');
      expect(payload.body).toBe('Body line one\nBody line two');
    });

    it('passes cc and bcc through to the mail service', async () => {
      send.mockResolvedValue({
        sent: true,
        messageId: null,
        recipient: 'client@acme.com',
        accepted: [],
        rejected: [],
      });

      await service.sendEmail({
        to: 'client@acme.com',
        cc: ['a@acme.com', 'b@acme.com'],
        bcc: ['hidden@acme.com'],
        subject: 'Subject',
      });

      const payload = send.mock.calls[0]?.[0];
      expect(payload.cc).toEqual(['a@acme.com', 'b@acme.com']);
      expect(payload.bcc).toEqual(['hidden@acme.com']);
    });

    it('sends an email with empty subject/body when none provided', async () => {
      send.mockResolvedValue({
        sent: true,
        messageId: null,
        recipient: 'client@acme.com',
        accepted: ['client@acme.com'],
        rejected: [],
      });

      await service.sendEmail({ to: 'client@acme.com' });

      const payload = send.mock.calls[0]?.[0];
      expect(payload.to).toBe('client@acme.com');
      expect(payload.subject).toBe('');
      expect(payload.body).toBe('');
    });
  });
});
