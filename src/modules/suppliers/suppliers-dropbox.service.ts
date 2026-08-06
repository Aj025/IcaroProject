import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DocumentCategory } from './dto/upload-dropbox.dto.js';
import { StoreDropboxLinkDto } from './dto/store-dropbox-link.dto.js';
import { DropboxLinkDto } from './dto/supplier-response.dto.js';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/heic',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
];

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.jpg',
  '.jpeg',
  '.png',
  '.heic',
  '.xlsx',
  '.csv',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

@Injectable()
export class SuppliersDropboxService {
  constructor(private prismaService: PrismaService) {}

  private get db() {
    return this.prismaService.prisma;
  }

  private async getDropboxToken(
    userId?: string,
  ): Promise<{ accessToken: string } | null> {
    const envToken = process.env.DROPBOX_ACCESS_TOKEN;
    if (envToken) return { accessToken: envToken };

    if (!userId) return null;

    const dbToken = await this.db.dropboxToken.findFirst({
      where: { userId, disconnectedAt: null },
      orderBy: { connectedAt: 'desc' },
    });

    if (!dbToken) return null;

    return { accessToken: dbToken.accessToken };
  }

  async uploadFile(
    supplierId: string,
    file: Express.Multer.File,
    category: DocumentCategory,
    description: string | undefined,
    userId: string,
  ): Promise<DropboxLinkDto> {
    const supplier = await this.db.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier || supplier.isDeleted) {
      throw new NotFoundException('Supplier not found');
    }

    const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `File type ${ext} not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File exceeds maximum size of 50 MB');
    }

    const dropboxToken = await this.getDropboxToken(userId);
    if (!dropboxToken) {
      throw new BadRequestException({
        needsAuth: true,
        message: 'Dropbox not connected',
      });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const folderPath =
      supplier.dropboxFolderPath ?? `/Suppliers/${supplier.company}/`;
    const dropboxPath = `${folderPath}${category}_${timestamp}_${file.originalname}`;

    let dropboxUrl: string;
    try {
      const { Dropbox } = await import('dropbox');
      const dbx = new Dropbox({ accessToken: dropboxToken.accessToken });

      const uploadResponse = await dbx.filesUpload({
        path: dropboxPath,
        contents: file.buffer,
      });

      const sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
        path: (uploadResponse.result as any).path_display,
      });

      dropboxUrl = (sharedLinkResponse.result as any).url;
    } catch {
      throw new BadRequestException('Failed to upload file to Dropbox');
    }

    const document = await this.db.supplierDocument.create({
      data: {
        supplierId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        dropboxPath,
        dropboxLink: dropboxUrl,
        category,
        uploadedBy: userId,
      },
    });

    const link = await this.db.dropboxLink.create({
      data: {
        supplierId,
        dropboxPath,
        dropboxUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        description: description ?? null,
        uploadedBy: userId,
      },
    });

    await this.updateComplianceFields(supplierId, category, dropboxUrl);

    return DropboxLinkDto.fromEntity({
      id: link.id,
      dropboxPath: link.dropboxPath,
      dropboxUrl: link.dropboxUrl,
      fileName: link.fileName,
      fileSize: link.fileSize,
      mimeType: link.mimeType,
      description: link.description,
      uploadedBy: link.uploadedBy,
      createdAt: link.createdAt,
    });
  }

  async storeLink(
    supplierId: string,
    dto: StoreDropboxLinkDto,
    userId: string,
  ): Promise<DropboxLinkDto> {
    const supplier = await this.db.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier || supplier.isDeleted) {
      throw new NotFoundException('Supplier not found');
    }

    const link = await this.db.dropboxLink.create({
      data: {
        supplierId,
        dropboxPath: '',
        dropboxUrl: dto.dropboxUrl,
        fileName: dto.fileName,
        fileSize: dto.fileSize ?? null,
        mimeType: dto.mimeType ?? null,
        description: dto.description ?? null,
        uploadedBy: userId,
      },
    });

    await this.db.supplierDocument.create({
      data: {
        supplierId,
        fileName: dto.fileName,
        fileSize: dto.fileSize ?? 0,
        mimeType: dto.mimeType ?? 'application/octet-stream',
        dropboxPath: '',
        dropboxLink: dto.dropboxUrl,
        category: dto.category,
        uploadedBy: userId,
      },
    });

    await this.updateComplianceFields(supplierId, dto.category, dto.dropboxUrl);

    return DropboxLinkDto.fromEntity({
      id: link.id,
      dropboxPath: link.dropboxPath,
      dropboxUrl: link.dropboxUrl,
      fileName: link.fileName,
      fileSize: link.fileSize,
      mimeType: link.mimeType,
      description: link.description,
      uploadedBy: link.uploadedBy,
      createdAt: link.createdAt,
    });
  }

  async getLinks(supplierId: string): Promise<DropboxLinkDto[]> {
    const supplier = await this.db.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier || supplier.isDeleted) {
      throw new NotFoundException('Supplier not found');
    }

    const links = await this.db.dropboxLink.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'desc' },
    });

    return links.map((link) =>
      DropboxLinkDto.fromEntity({
        id: link.id,
        dropboxPath: link.dropboxPath,
        dropboxUrl: link.dropboxUrl,
        fileName: link.fileName,
        fileSize: link.fileSize,
        mimeType: link.mimeType,
        description: link.description,
        uploadedBy: link.uploadedBy,
        createdAt: link.createdAt,
      }),
    );
  }

  async deleteLink(supplierId: string, linkId: string): Promise<void> {
    const link = await this.db.dropboxLink.findFirst({
      where: { id: linkId, supplierId },
    });
    if (!link) throw new NotFoundException('Dropbox link not found');

    await this.db.supplierDocument.deleteMany({
      where: { dropboxLink: link.dropboxUrl, supplierId },
    });

    await this.db.dropboxLink.delete({ where: { id: linkId } });
  }

  private async updateComplianceFields(
    supplierId: string,
    category: DocumentCategory,
    url: string,
  ): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (category === 'RAMS') {
      updateData.ramsUrl = url;
    } else if (category === 'INSURANCE') {
      updateData.insuranceUrl = url;
    }

    if (Object.keys(updateData).length > 0) {
      await this.db.supplier.update({
        where: { id: supplierId },
        data: updateData,
      });
    }
  }
}
