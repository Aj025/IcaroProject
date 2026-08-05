import type { EmailTemplateDefinition } from '../constants/default-email-templates.js';

export interface EmailTemplateEntity {
  id: string;
  key: string;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
  updatedAt: Date | null;
}

export interface EmailTemplateListResponse {
  templates: EmailTemplateEntity[];
}

export interface SentEmailResponse {
  sent: boolean;
  messageId: string | null;
  recipient: string;
  accepted: string[];
  rejected: string[];
  note?: string;
}

export interface ResetEmailTemplateResponse extends EmailTemplateEntity {
  reset: boolean;
}

export function fromDefinition(
  def: EmailTemplateDefinition,
): EmailTemplateEntity {
  return {
    id: '',
    key: def.key,
    name: def.name,
    subject: def.subject,
    body: def.body,
    isDefault: true,
    updatedAt: null,
  };
}
