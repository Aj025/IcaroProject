import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  SupplierComplianceDto,
  ExpiringItemDto,
} from './dto/compliance-response.dto.js';

@Injectable()
export class SuppliersComplianceService {
  constructor(private prismaService: PrismaService) {}

  private get db() {
    return this.prismaService.prisma;
  }

  async getExpiring(
    withinDays: number = 30,
    categories: string[] = ['RAMS', 'INSURANCE', 'CIS'],
  ): Promise<SupplierComplianceDto[]> {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

    const suppliers = await this.db.supplier.findMany({
      where: { isDeleted: false },
    });

    const result: SupplierComplianceDto[] = [];

    for (const supplier of suppliers) {
      const items: ExpiringItemDto[] = [];

      for (const category of categories) {
        let expiryDate: Date | null = null;
        let documentUrl: string | null = null;

        if (category === 'RAMS') {
          expiryDate = supplier.ramsExpiry;
          documentUrl = supplier.ramsUrl;
        } else if (category === 'INSURANCE') {
          expiryDate = supplier.insuranceExpiry;
          documentUrl = supplier.insuranceUrl;
        } else if (category === 'CIS') {
          expiryDate = supplier.cisExpiry;
        }

        if (!expiryDate) {
          items.push({
            category,
            expiryDate: '',
            daysRemaining: 0,
            documentUrl,
            status: 'missing',
          });
          continue;
        }

        const daysRemaining = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        let status: 'expiring_soon' | 'expired' | 'missing';
        if (daysRemaining < 0) {
          status = 'expired';
        } else if (daysRemaining <= withinDays) {
          status = 'expiring_soon';
        } else {
          continue;
        }

        items.push({
          category,
          expiryDate: expiryDate.toISOString(),
          daysRemaining: Math.max(daysRemaining, 0),
          documentUrl,
          status,
        });
      }

      if (items.length > 0) {
        result.push({
          supplierId: supplier.id,
          supplierName: supplier.company,
          trade: supplier.trade,
          expiringItems: items,
        });
      }
    }

    return result;
  }
}
