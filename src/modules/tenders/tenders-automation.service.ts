import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ClaudeService } from '../../common/integrations/claude.service.js';
import { EmailService } from '../../common/integrations/email.service.js';

@Injectable()
export class TendersAutomationService {
  constructor(
    private prismaService: PrismaService,
    private claude: ClaudeService,
    private email: EmailService,
  ) {}

  private get db() {
    return this.prismaService.prisma;
  }

  async processGmailIntake(
    sourceEmailId: string,
    subject: string,
    body: string,
    receivedDate: string,
  ) {
    const existing = await this.db.tender.findUnique({
      where: { sourceEmailId },
    });
    if (existing) return { duplicate: true, id: existing.id };

    const parsed = await this.claude.parseEmail(body, subject);
    const now = new Date();

    const tender = await this.db.tender.create({
      data: {
        client: parsed.client ?? 'Unknown Client',
        job: parsed.jobDescription ?? subject,
        received: new Date(receivedDate),
        due: parsed.dueDate
          ? new Date(parsed.dueDate)
          : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        status: 'Pricing',
        sourceEmailId,
        needsReview: parsed.confidence === 'low',
        estimateRequestedAt: now,
      },
    });

    return { duplicate: false, id: tender.id, needsReview: tender.needsReview };
  }

  async findPendingEstimates() {
    const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.db.tender.findMany({
      where: {
        contractSum: null,
        estimateRequestedAt: { lte: cutoff },
        OR: [
          { lastReminderSentAt: null },
          { lastReminderSentAt: { lt: today } },
        ],
        isDeleted: false,
      },
      include: { assignedEstimator: true },
    });
  }

  async markReminded(id: string) {
    const tender = await this.db.tender.findUnique({ where: { id } });
    if (!tender) throw new NotFoundException('Tender not found');

    await this.db.tender.update({
      where: { id },
      data: { lastReminderSentAt: new Date() },
    });
  }
}
