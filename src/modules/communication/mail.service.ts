import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import type { SendEmailDto } from './dto/communication.dto.js';
import type { SentEmailResponse } from './dto/email-template-response.dto.js';

interface SentMessageInfo {
  messageId?: string;
  accepted?: string[];
  rejected?: string[];
}

interface SmtpConfig {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter<SentMessageInfo> | null = null;

  constructor(private readonly configService: ConfigService) {}

  private get smtpConfig(): SmtpConfig {
    return this.configService.get<SmtpConfig>('app.email.smtp') ?? {};
  }

  private get transport(): Transporter<SentMessageInfo> | null {
    if (this.transporter) return this.transporter;

    const smtp = this.smtpConfig;
    if (!smtp.host) {
      this.logger.warn(
        'SMTP_HOST not configured. Emails will not be sent; check .env.',
      );
      return null;
    }

    const port = smtp.port ?? (smtp.user ? 587 : 25);
    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port,
      secure: port === 465,
      auth: smtp.user ? { user: smtp.user, pass: smtp.pass ?? '' } : undefined,
    }) as Transporter<SentMessageInfo>;
    return this.transporter;
  }

  async send(dto: SendEmailDto): Promise<SentEmailResponse> {
    const transport = this.transport;

    if (!transport) {
      this.logger.warn(`Email send skipped (SMTP not configured) -> ${dto.to}`);
      return {
        sent: false,
        messageId: null,
        recipient: dto.to,
        accepted: [],
        rejected: [dto.to],
        note: 'SMTP is not configured',
      };
    }

    const smtp = this.smtpConfig;
    const info: SentMessageInfo = await transport.sendMail({
      from: smtp.from ?? smtp.user ?? undefined,
      to: dto.to,
      cc: dto.cc && dto.cc.length > 0 ? dto.cc : undefined,
      bcc: dto.bcc && dto.bcc.length > 0 ? dto.bcc : undefined,
      subject: dto.subject,
      text: dto.body,
    });

    const rejected = info.rejected ?? [];

    if (rejected.length > 0) {
      this.logger.warn(
        `Email send had rejected recipients -> ${rejected.join(', ')}`,
      );
    }

    return {
      sent: rejected.length === 0,
      messageId: info.messageId ?? null,
      recipient: dto.to,
      accepted: info.accepted ?? [],
      rejected,
      note:
        rejected.length > 0
          ? `Some recipients were rejected: ${rejected.join(', ')}`
          : undefined,
    };
  }
}
