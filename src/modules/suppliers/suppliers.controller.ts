import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { SuppliersService } from './suppliers.service.js';
import { SuppliersComplianceService } from './suppliers-compliance.service.js';
import { SuppliersDropboxService } from './suppliers-dropbox.service.js';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';
import { UpdateSupplierDto } from './dto/update-supplier.dto.js';
import { QuerySuppliersDto } from './dto/query-suppliers.dto.js';
import { MergeSuppliersDto } from './dto/merge-suppliers.dto.js';
import { UploadDropboxDto } from './dto/upload-dropbox.dto.js';
import { StoreDropboxLinkDto } from './dto/store-dropbox-link.dto.js';

@Controller('suppliers')
@UseGuards(AuthGuard, PermissionsGuard, RolesGuard)
@RequirePermission('Suppliers')
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
    private readonly complianceService: SuppliersComplianceService,
    private readonly dropboxService: SuppliersDropboxService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateSupplierDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.suppliersService.create(dto, user.id);
  }

  @Get('compliance/expiring')
  getExpiring(
    @Query('withinDays') withinDays?: string,
    @Query('categories') categories?: string,
  ) {
    const catArr = categories
      ? categories.split(',')
      : ['RAMS', 'INSURANCE', 'CIS'];
    return this.complianceService.getExpiring(
      withinDays ? parseInt(withinDays, 10) : 30,
      catArr,
    );
  }

  @Get()
  findAll(@Query() query: QuerySuppliersDto) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  softDelete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.suppliersService.softDelete(id, user.id);
  }

  @Delete(':id/permanent')
  @Roles('admin')
  permanentDelete(@Param('id') id: string) {
    return this.suppliersService.permanentDelete(id);
  }

  @Post(':id/restore')
  @Roles('admin')
  restore(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.suppliersService.restore(id, user.id);
  }

  @Post('merge')
  @Roles('admin')
  merge(
    @Body() dto: MergeSuppliersDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.suppliersService.merge(dto, user.id);
  }

  @Post(':id/dropbox/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDropboxDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dropboxService.uploadFile(
      id,
      file,
      dto.category,
      dto.description,
      user.id,
    );
  }

  @Post(':id/dropbox/link')
  storeLink(
    @Param('id') id: string,
    @Body() dto: StoreDropboxLinkDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dropboxService.storeLink(id, dto, user.id);
  }

  @Get(':id/dropbox/links')
  getLinks(@Param('id') id: string) {
    return this.dropboxService.getLinks(id);
  }

  @Delete(':id/dropbox/links/:linkId')
  @Roles('admin')
  deleteLink(@Param('id') id: string, @Param('linkId') linkId: string) {
    return this.dropboxService.deleteLink(id, linkId);
  }
}
