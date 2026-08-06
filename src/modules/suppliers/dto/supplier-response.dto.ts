function toISOOrString(d: Date | string | null | undefined): string | null {
  if (d == null) return null;
  return d instanceof Date ? d.toISOString() : d;
}

function toDateOrNull(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

export interface SupplierEntity {
  id: string;
  tenantId: string;
  company: string;
  trade: string;
  contact: string;
  phone: string;
  email: string;
  note: string;
  projectIds: string[];
  usedBefore: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  ramsUrl: string | null;
  ramsExpiry: Date | null;
  insuranceUrl: string | null;
  insuranceExpiry: Date | null;
  cisStatus: string;
  cisExpiry: Date | null;
  dropboxAccountId: string | null;
  dropboxFolderPath: string | null;
  createdAt: Date;
  updatedAt: Date;
  documents?: SupplierDocumentEntity[];
  dropboxLinks?: DropboxLinkEntity[];
}

export interface SupplierDocumentEntity {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dropboxPath: string;
  dropboxLink: string;
  category: string;
  uploadedAt: Date;
}

export interface DropboxLinkEntity {
  id: string;
  dropboxPath: string;
  dropboxUrl: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  description: string | null;
  uploadedBy: string;
  createdAt: Date;
}

export class SupplierListItemDto {
  id: string = '';
  company: string = '';
  trade: string = '';
  contact: string = '';
  phone: string = '';
  email: string = '';
  note: string = '';
  projectIds: string[] = [];
  usedBefore: boolean = false;
  isDeleted: boolean = false;
  createdAt: string = '';
  updatedAt: string = '';

  static fromEntity(entity: SupplierEntity): SupplierListItemDto {
    const dto = new SupplierListItemDto();
    dto.id = entity.id;
    dto.company = entity.company;
    dto.trade = entity.trade;
    dto.contact = entity.contact;
    dto.phone = entity.phone;
    dto.email = entity.email;
    dto.note = entity.note;
    dto.projectIds = entity.projectIds;
    dto.usedBefore = entity.usedBefore;
    dto.isDeleted = entity.isDeleted;
    dto.createdAt = toISOOrString(entity.createdAt)!;
    dto.updatedAt = toISOOrString(entity.updatedAt)!;
    return dto;
  }
}

export class SupplierDetailDto {
  id: string = '';
  company: string = '';
  trade: string = '';
  contact: string = '';
  phone: string = '';
  email: string = '';
  note: string = '';
  projectIds: string[] = [];
  usedBefore: boolean = false;
  isDeleted: boolean = false;
  ramsUrl: string | null = null;
  ramsExpiry: string | null = null;
  insuranceUrl: string | null = null;
  insuranceExpiry: string | null = null;
  cisStatus: string = 'Unregistered';
  cisExpiry: string | null = null;
  dropboxAccountId: string | null = null;
  dropboxFolderPath: string | null = null;
  documents: SupplierDocumentDto[] = [];
  dropboxLinks: DropboxLinkDto[] = [];
  createdAt: string = '';
  updatedAt: string = '';

  static fromEntity(entity: SupplierEntity): SupplierDetailDto {
    const dto = new SupplierDetailDto();
    dto.id = entity.id;
    dto.company = entity.company;
    dto.trade = entity.trade;
    dto.contact = entity.contact;
    dto.phone = entity.phone;
    dto.email = entity.email;
    dto.note = entity.note;
    dto.projectIds = entity.projectIds;
    dto.usedBefore = entity.usedBefore;
    dto.isDeleted = entity.isDeleted;
    dto.ramsUrl = entity.ramsUrl;
    dto.ramsExpiry = toDateOrNull(entity.ramsExpiry);
    dto.insuranceUrl = entity.insuranceUrl;
    dto.insuranceExpiry = toDateOrNull(entity.insuranceExpiry);
    dto.cisStatus = entity.cisStatus;
    dto.cisExpiry = toDateOrNull(entity.cisExpiry);
    dto.dropboxAccountId = entity.dropboxAccountId;
    dto.dropboxFolderPath = entity.dropboxFolderPath;
    dto.documents = (entity.documents ?? []).map(
      SupplierDocumentDto.fromEntity,
    );
    dto.dropboxLinks = (entity.dropboxLinks ?? []).map(
      DropboxLinkDto.fromEntity,
    );
    dto.createdAt = toISOOrString(entity.createdAt)!;
    dto.updatedAt = toISOOrString(entity.updatedAt)!;
    return dto;
  }
}

export class SupplierDocumentDto {
  id: string = '';
  fileName: string = '';
  fileSize: number = 0;
  mimeType: string = '';
  dropboxPath: string = '';
  dropboxLink: string = '';
  category: string = '';
  uploadedAt: string = '';

  static fromEntity(entity: SupplierDocumentEntity): SupplierDocumentDto {
    const dto = new SupplierDocumentDto();
    dto.id = entity.id;
    dto.fileName = entity.fileName;
    dto.fileSize = entity.fileSize;
    dto.mimeType = entity.mimeType;
    dto.dropboxPath = entity.dropboxPath;
    dto.dropboxLink = entity.dropboxLink;
    dto.category = entity.category;
    dto.uploadedAt = toISOOrString(entity.uploadedAt)!;
    return dto;
  }
}

export class DropboxLinkDto {
  id: string = '';
  dropboxPath: string = '';
  dropboxUrl: string = '';
  fileName: string = '';
  fileSize: number | null = null;
  mimeType: string | null = null;
  description: string | null = null;
  uploadedBy: string = '';
  createdAt: string = '';

  static fromEntity(entity: DropboxLinkEntity): DropboxLinkDto {
    const dto = new DropboxLinkDto();
    dto.id = entity.id;
    dto.dropboxPath = entity.dropboxPath;
    dto.dropboxUrl = entity.dropboxUrl;
    dto.fileName = entity.fileName;
    dto.fileSize = entity.fileSize;
    dto.mimeType = entity.mimeType;
    dto.description = entity.description;
    dto.uploadedBy = entity.uploadedBy;
    dto.createdAt = toISOOrString(entity.createdAt)!;
    return dto;
  }
}

export class PaginationMetaDto {
  total: number = 0;
  page: number = 1;
  limit: number = 20;
  totalPages: number = 0;

  static from(total: number, page: number, limit: number): PaginationMetaDto {
    const dto = new PaginationMetaDto();
    dto.total = total;
    dto.page = page;
    dto.limit = limit;
    dto.totalPages = Math.ceil(total / limit) || 1;
    return dto;
  }
}
