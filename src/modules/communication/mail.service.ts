import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SendEmailDto } from './dto/communication.dto.js';
import type { SentEmailResponse } from './dto/email-template-response.dto.js';

interface BrevoConfig {
  apiKey?: string;
  from?: string;
}

interface BrevoSuccessBody {
  messageId?: string;
}

interface BrevoErrorBody {
  message?: string;
}

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  private get brevoConfig(): BrevoConfig {
    return {
      apiKey: this.configService.get<string>('app.email.apiKey'),
      from: this.configService.get<string>('app.email.from'),
    };
  }

  private parseFrom(from: string): { email: string; name?: string } {
    const match = /^(.+?)\s*<([^>]+)>$/.exec(from.trim());
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { email: from.trim() };
  }

  private toBrevoRecipients(emails?: string[]): { email: string }[] {
    return (emails ?? []).map((email) => ({ email: email.trim() }));
  }

  async send(dto: SendEmailDto): Promise<SentEmailResponse> {
    const { apiKey, from } = this.brevoConfig;

    if (!apiKey) {
      this.logger.warn(
        `Email send skipped (BREVO_API_KEY not configured) -> ${dto.to}`,
      );
      return {
        sent: false,
        messageId: null,
        recipient: dto.to,
        accepted: [],
        rejected: [dto.to],
        note: 'Brevo API key is not configured',
      };
    }

    if (!from) {
      this.logger.warn(
        `Email send skipped (EMAIL_FROM not configured) -> ${dto.to}`,
      );
      return {
        sent: false,
        messageId: null,
        recipient: dto.to,
        accepted: [],
        rejected: [dto.to],
        note: 'Sender address (EMAIL_FROM) is not configured',
      };
    }

    try {
      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: this.parseFrom(from),
          to: this.toBrevoRecipients([dto.to]),
          cc: this.toBrevoRecipients(dto.cc),
          bcc: this.toBrevoRecipients(dto.bcc),
          subject: dto.subject,
          textContent: dto.body,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response
          .json()
          .catch(() => ({}))) as BrevoErrorBody;
        const reason = errorBody.message ?? `HTTP ${response.status}`;
        this.logger.warn(`Brevo rejected email -> ${dto.to}: ${reason}`);

        return {
          sent: false,
          messageId: null,
          recipient: dto.to,
          accepted: [],
          rejected: [dto.to],
          note: `Brevo error: ${reason}`,
        };
      }

      const body = (await response.json()) as BrevoSuccessBody;

      return {
        sent: true,
        messageId: body.messageId ?? null,
        recipient: dto.to,
        accepted: [dto.to],
        rejected: [],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Brevo request failed -> ${dto.to}: ${message}`);

      return {
        sent: false,
        messageId: null,
        recipient: dto.to,
        accepted: [],
        rejected: [dto.to],
        note: `Brevo request failed: ${message}`,
      };
    }
  }
}
