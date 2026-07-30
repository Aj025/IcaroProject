import type { CatalogEntry } from './layout-response.dto.js';

export class CatalogResponseDto {
  catalog: CatalogEntry[];

  static fromCatalog(catalog: CatalogEntry[]): CatalogResponseDto {
    const dto = new CatalogResponseDto();
    dto.catalog = catalog;
    return dto;
  }
}
