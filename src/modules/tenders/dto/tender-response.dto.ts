function toISOOrString(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : d;
}

function toNumberOrNull(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v !== null && 'toNumber' in v) {
    return (v as { toNumber(): number }).toNumber();
  }
  return Number(v) || null;
}

export interface TenderEntity {
  id: string;
  client: string;
  job: string;
  email: string | null;
  received: Date;
  due: Date;
  status: string;
  contractSum?: unknown;
  isSigned: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class TenderResponseDto {
  id: string = '';
  client: string = '';
  job: string = '';
  email: string = '';
  received: string = '';
  due: string = '';
  status: string = '';
  contractSum?: number | null;
  isSigned: boolean = false;
  deleted: boolean = false;
  deletedAt?: string | null;
  createdAt: string = '';
  updatedAt: string = '';

  static fromEntity(
    tender: TenderEntity,
    includeContractSum: boolean,
  ): TenderResponseDto {
    const dto = new TenderResponseDto();
    dto.id = tender.id;
    dto.client = tender.client;
    dto.job = tender.job;
    dto.email = tender.email ?? '';
    dto.received = toISOOrString(tender.received);
    dto.due = toISOOrString(tender.due);
    dto.status = tender.status;
    dto.contractSum = includeContractSum
      ? toNumberOrNull(tender.contractSum)
      : undefined;
    dto.isSigned = tender.isSigned;
    dto.deleted = tender.isDeleted;
    dto.deletedAt = tender.deletedAt ? toISOOrString(tender.deletedAt) : null;
    dto.createdAt = toISOOrString(tender.createdAt);
    dto.updatedAt = toISOOrString(tender.updatedAt);
    return dto;
  }
}
