import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ClaudeExtractedTender {
  client?: string;
  jobDescription?: string;
  dueDate?: string;
  confidence: 'high' | 'low';
}

interface ClaudeResponse {
  content?: Array<{ text?: string }>;
}

@Injectable()
export class ClaudeService {
  constructor(private configService: ConfigService) {}

  async parseEmail(
    body: string,
    subject: string,
  ): Promise<ClaudeExtractedTender> {
    const apiKey = this.configService.get<string>('CLAUDE_API_KEY');
    if (!apiKey) {
      return { confidence: 'low' };
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: `Extract tender information from this email.

Subject: ${subject}

Body:
${body}

Return a JSON object with: client (string), jobDescription (string), dueDate (ISO date string).
If you cannot confidently extract a field, omit it.
Respond with ONLY the JSON object, no other text.`,
            },
          ],
        }),
      });

      const data = (await response.json()) as ClaudeResponse;
      const content = data.content?.[0]?.text;
      if (!content) return { confidence: 'low' };

      const parsed = JSON.parse(content) as Record<string, string | undefined>;
      const hasRequired =
        parsed.client && parsed.jobDescription && parsed.dueDate;

      return {
        client: parsed.client,
        jobDescription: parsed.jobDescription,
        dueDate: parsed.dueDate,
        confidence: hasRequired ? 'high' : 'low',
      };
    } catch {
      return { confidence: 'low' };
    }
  }
}
