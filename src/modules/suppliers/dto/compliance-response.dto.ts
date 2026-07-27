export class ExpiringItemDto {
  category: string = '';
  expiryDate: string = '';
  daysRemaining: number = 0;
  documentUrl: string | null = null;
  status: 'expiring_soon' | 'expired' | 'missing' = 'expiring_soon';
}

export class SupplierComplianceDto {
  supplierId: string = '';
  supplierName: string = '';
  trade: string = '';
  expiringItems: ExpiringItemDto[] = [];
}
