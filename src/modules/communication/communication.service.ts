import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  DEFAULT_EMAIL_TEMPLATES,
  getDefaultTemplate,
} from './constants/default-email-templates.js';
import type {
  BuildMailtoDto,
  UpdateEmailTemplateDto,
} from './dto/communication.dto.js';
import {
  fromDefinition,
  type EmailTemplateEntity,
  type EmailTemplateListResponse,
  type MailtoResponse,
  type ResetEmailTemplateResponse,
} from './dto/email-template-response.dto.js';

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

@Injectable()
export class CommunicationService {
  constructor(private prismaService: PrismaService) {}

  private get db() {
    return this.prismaService.prisma;
  }

  private tenantId(): string {
    return process.env.TENANT_ID ?? 'default';
  }

  async listTemplates(): Promise<EmailTemplateListResponse> {
    const rows = await this.db.emailTemplate.findMany({
      where: { tenantId: this.tenantId() },
    });

    const byKey = new Map<string, EmailTemplateRow>(
      rows.map((r) => [r.key, r]),
    );

    const templates = DEFAULT_EMAIL_TEMPLATES.map((def) => {
      const row = byKey.get(def.key);
      return row ? this.fromRow(row) : fromDefinition(def);
    });

    return { templates };
  }

  async getTemplate(key: string): Promise<EmailTemplateEntity> {
    const def = getDefaultTemplate(key);
    if (!def) throw new NotFoundException(`Unknown email template key: ${key}`);

    const row = await this.db.emailTemplate.findUnique({
      where: {
        tenantId_key: {
          tenantId: this.tenantId(),
          key,
        },
      },
    });

    if (!row) return fromDefinition(def);
    return this.fromRow(row);
  }

  async updateTemplate(
    key: string,
    dto: UpdateEmailTemplateDto,
    userId: string,
  ): Promise<EmailTemplateEntity> {
    const def = getDefaultTemplate(key);
    if (!def) throw new NotFoundException(`Unknown email template key: ${key}`);

    const merged = {
      subject: dto.subject ?? def.subject,
      body: dto.body ?? def.body,
    };

    await this.db.emailTemplate.upsert({
      where: {
        tenantId_key: {
          tenantId: this.tenantId(),
          key,
        },
      },
      create: {
        tenantId: this.tenantId(),
        key,
        name: def.name,
        ...merged,
        updatedById: userId,
      },
      update: {
        ...merged,
        updatedById: userId,
      },
    });

    return this.getTemplate(key);
  }

  async resetTemplate(
    key: string,
    userId: string,
  ): Promise<ResetEmailTemplateResponse> {
    const def = getDefaultTemplate(key);
    if (!def) throw new NotFoundException(`Unknown email template key: ${key}`);

    const row = await this.db.emailTemplate.findUnique({
      where: {
        tenantId_key: {
          tenantId: this.tenantId(),
          key,
        },
      },
    });

    if (row) {
      await this.db.auditLog.create({
        data: {
          entityType: 'EmailTemplate',
          entityId: row.id,
          field: 'reset',
          oldValue: JSON.stringify({
            subject: row.subject,
            bodyLength: row.body.length,
          }),
          newValue: null,
          changedById: userId,
        },
      });
      await this.db.emailTemplate.delete({ where: { id: row.id } });
    }

    return { ...fromDefinition(def), reset: true };
  }

  async buildMailto(dto: BuildMailtoDto): Promise<MailtoResponse> {
    let subject = '';
    let body = '';

    if (dto.templateKey) {
      const template = await this.getTemplate(dto.templateKey);
      subject = template.subject;
      body = template.body;
    }

    if (dto.subject !== undefined) subject = dto.subject;
    if (dto.body !== undefined) body = dto.body;

    subject = this.substitute(subject, dto.data);
    body = this.substitute(body, dto.data);

    const params = new URLSearchParams();
    if (dto.cc && dto.cc.length > 0) params.set('cc', dto.cc.join(','));
    if (dto.bcc && dto.bcc.length > 0) params.set('bcc', dto.bcc.join(','));
    if (subject) params.set('subject', subject);
    if (body) params.set('body', body);

    const query = params.toString();
    const mailto = query ? `mailto:${dto.to}?${query}` : `mailto:${dto.to}`;
    return {
      mailto,
      recipient: dto.to,
      cc: dto.cc ?? [],
      bcc: dto.bcc ?? [],
      subject,
      body,
    };
  }

  private substitute(text: string, data?: Record<string, string>): string {
    if (!data) return text;
    return Object.entries(data).reduce(
      (acc, [key, value]) => acc.replaceAll(`{${key}}`, value ?? ''),
      text,
    );
  }

  private fromRow(row: EmailTemplateRow): EmailTemplateEntity {
    return {
      id: row.id,
      key: row.key,
      name: row.name,
      subject: row.subject,
      body: row.body,
      isDefault: false,
      updatedAt: row.updatedAt,
    };
  }
}
