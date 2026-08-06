import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SendEmailDto } from './dto/communication.dto.js';
import type { SentEmailResponse } from './dto/email-template-response.dto.js';

interface ResendConfig {
  apiKey?: string;
  from?: string;
}

interface ResendSuccessBody {
  id: string;
}

interface ResendErrorBody {
  name?: string;
  message?: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  private get resendConfig(): ResendConfig {
    return {
      apiKey: this.configService.get<string>('app.email.apiKey'),
      from: this.configService.get<string>('app.email.from'),
    };
  }

  async send(dto: SendEmailDto): Promise<SentEmailResponse> {
    const { apiKey, from } = this.resendConfig;

    if (!apiKey) {
      this.logger.warn(
        `Email send skipped (RESEND_API_KEY not configured) -> ${dto.to}`,
      );
      return {
        sent: false,
        messageId: null,
        recipient: dto.to,
        accepted: [],
        rejected: [dto.to],
        note: 'Resend API key is not configured',
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
      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [dto.to],
          cc: dto.cc && dto.cc.length > 0 ? dto.cc : undefined,
          bcc: dto.bcc && dto.bcc.length > 0 ? dto.bcc : undefined,
          subject: dto.subject,
          text: dto.body,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response
          .json()
          .catch(() => ({}))) as ResendErrorBody;
        const reason = errorBody.message ?? `HTTP ${response.status}`;
        this.logger.warn(`Resend rejected email -> ${dto.to}: ${reason}`);

        return {
          sent: false,
          messageId: null,
          recipient: dto.to,
          accepted: [],
          rejected: [dto.to],
          note: `Resend error: ${reason}`,
        };
      }

      const body = (await response.json()) as ResendSuccessBody;

      return {
        sent: true,
        messageId: body.id ?? null,
        recipient: dto.to,
        accepted: [dto.to],
        rejected: [],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Resend request failed -> ${dto.to}: ${message}`);

      return {
        sent: false,
        messageId: null,
        recipient: dto.to,
        accepted: [],
        rejected: [dto.to],
        note: `Resend request failed: ${message}`,
      };
    }
  }
}