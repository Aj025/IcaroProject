jest.mock('../../prisma/prisma.service.js', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    prisma: {
      tender: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    },
  })),
}));

jest.mock('../../common/integrations/claude.service.js', () => ({
  ClaudeService: jest.fn().mockImplementation(() => ({
    parseEmail: jest.fn(),
  })),
}));

jest.mock('../../common/integrations/email.service.js', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendReminder: jest.fn(),
  })),
}));

import { PrismaService } from '../../prisma/prisma.service.js';
import { ClaudeService } from '../../common/integrations/claude.service.js';
import { EmailService } from '../../common/integrations/email.service.js';
import { TendersAutomationService } from './tenders-automation.service.js';

describe('TendersAutomationService', () => {
  let service: TendersAutomationService;
  let db: any;
  let claude: any;
  let email: any;

  beforeEach(() => {
    const prisma = new PrismaService();
    db = prisma.prisma;
    claude = new ClaudeService();
    email = new EmailService();
    service = new TendersAutomationService(prisma, claude, email);
    jest.clearAllMocks();
  });

  describe('processGmailIntake', () => {
    it('returns duplicate when sourceEmailId exists', async () => {
      db.tender.findUnique.mockResolvedValue({ id: 'existing-id' });
      const result = await service.processGmailIntake(
        'dup-id',
        'subj',
        'body',
        '2026-07-01',
      );
      expect(result.duplicate).toBe(true);
      expect(result.id).toBe('existing-id');
      expect(db.tender.create).not.toHaveBeenCalled();
    });

    it('creates a tender from well-formed Claude response', async () => {
      db.tender.findUnique.mockResolvedValue(null);
      claude.parseEmail.mockResolvedValue({
        client: 'Parsed Client',
        jobDescription: 'Parsed job',
        dueDate: '2026-07-20',
        confidence: 'high',
      });
      db.tender.create.mockResolvedValue({ id: 'new-id', needsReview: false });
      const result = await service.processGmailIntake(
        'email-1',
        'subject',
        'body',
        '2026-07-01',
      );
      expect(result.duplicate).toBe(false);
      expect(result.needsReview).toBe(false);
      expect(db.tender.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            client: 'Parsed Client',
            sourceEmailId: 'email-1',
          }),
        }),
      );
    });

    it('sets needsReview when Claude has low confidence', async () => {
      db.tender.findUnique.mockResolvedValue(null);
      claude.parseEmail.mockResolvedValue({ confidence: 'low' });
      db.tender.create.mockResolvedValue({
        id: 'new-id-low',
        needsReview: true,
      });
      const result = await service.processGmailIntake(
        'email-2',
        'subject',
        'body',
        '2026-07-01',
      );
      expect(result.needsReview).toBe(true);
      expect(db.tender.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            needsReview: true,
            client: 'Unknown Client',
          }),
        }),
      );
    });

    it('repeated sourceEmailId is a no-op', async () => {
      db.tender.findUnique.mockResolvedValue({ id: 'existing' });
      const r1 = await service.processGmailIntake(
        'same-id',
        'subj',
        'body',
        '2026-07-01',
      );
      expect(r1.duplicate).toBe(true);
      const r2 = await service.processGmailIntake(
        'same-id',
        'subj',
        'body',
        '2026-07-01',
      );
      expect(r2.duplicate).toBe(true);
      expect(db.tender.create).not.toHaveBeenCalled();
    });
  });

  describe('findPendingEstimates', () => {
    it('returns tenders without estimate older than 2 days', async () => {
      const oldDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      db.tender.findMany.mockResolvedValue([
        {
          id: 'pending-1',
          contractSum: null,
          estimateRequestedAt: oldDate,
          lastReminderSentAt: null,
          isDeleted: false,
        },
      ]);
      const result = await service.findPendingEstimates();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pending-1');
    });

    it('does not return recently requested tenders', async () => {
      db.tender.findMany.mockResolvedValue([]);
      const result = await service.findPendingEstimates();
      expect(result).toHaveLength(0);
    });
  });

  describe('markReminded', () => {
    it('sets lastReminderSentAt to now', async () => {
      db.tender.findUnique.mockResolvedValue({ id: 'tender-1' });
      db.tender.update.mockResolvedValue({});
      await service.markReminded('tender-1');
      expect(db.tender.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tender-1' },
          data: expect.objectContaining({
            lastReminderSentAt: expect.any(Date),
          }),
        }),
      );
    });

    it('throws when tender not found', async () => {
      db.tender.findUnique.mockResolvedValue(null);
      await expect(service.markReminded('nonexistent')).rejects.toThrow();
    });
  });
});
