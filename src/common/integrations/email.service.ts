import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {}

  sendReminder(to: string, subject: string): void {
    const apiKey = this.configService.get<string>(
      'TRANSACTIONAL_EMAIL_API_KEY',
    );
    if (!apiKey) {
      return;
    }

    // Placeholder for transactional email provider (Postmark / Resend)
    console.log(`[EmailService] Would send email to ${to}: ${subject}`);
  }
}
