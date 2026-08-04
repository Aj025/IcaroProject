export const EMAIL_TEMPLATE_KEYS = [
  'quotation_to_estimator',
  'quotation_to_client',
] as const;

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export interface EmailTemplateDefinition {
  key: EmailTemplateKey;
  name: string;
  subject: string;
  body: string;
}

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplateDefinition[] = [
  {
    key: 'quotation_to_estimator',
    name: 'Quotation request — estimator',
    subject: 'Estimate needed: {job} — {client}',
    body: [
      'Hi {estimatorName},',
      '',
      'Please prepare a quotation for the following tender:',
      '',
      'Client: {client}',
      'Job: {job}',
      'Due: {due}',
      '',
      'Please send me your estimate as soon as possible.',
      '',
      'Thanks,',
      '{companyName}',
    ].join('\n'),
  },
  {
    key: 'quotation_to_client',
    name: 'Quotation — client',
    subject: 'Quotation for {job} — {client}',
    body: [
      'Dear {client},',
      '',
      'Please find attached our quotation for the {job} works.',
      '',
      'Quotation amount: {quoteAmount}',
      'Tender due: {due}',
      '',
      'If you have any questions, please do not hesitate to get in touch.',
      '',
      'Kind regards,',
      '{companyName}',
    ].join('\n'),
  },
];

export function getDefaultTemplate(
  key: string,
): EmailTemplateDefinition | undefined {
  return DEFAULT_EMAIL_TEMPLATES.find((t) => t.key === key);
}
