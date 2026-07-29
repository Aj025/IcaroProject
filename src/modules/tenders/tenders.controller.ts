import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { TendersService } from './tenders.service.js';
import { CreateTenderDto } from './dto/create-tender.dto.js';
import { UpdateTenderDto } from './dto/update-tender.dto.js';
import { UpdateTenderStatusDto } from './dto/update-tender-status.dto.js';
import { UpdateTenderEstimateDto } from './dto/update-tender-estimate.dto.js';

@Controller('tenders')
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('Tenders')
export class TendersController {
  constructor(private readonly tendersService: TendersService) {}

  @Post()
  create(@Body() dto: CreateTenderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.tendersService.create(dto, user.id);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.tendersService.findAll({
      status,
      search,
      includeDeleted: includeDeleted === 'true',
    });
  }

  @Get('snapshot')
  getSnapshot(): Promise<import('./tenders.service.js').SnapshotItem[]> {
    return this.tendersService.getSnapshot();
  }

  @Get('check-source-email')
  checkSourceEmail(@Query('sourceEmailId') sourceEmailId: string) {
    return this.tendersService.checkSourceEmailExists(sourceEmailId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tendersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenderDto) {
    return this.tendersService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTenderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tendersService.updateStatus(id, dto, user.id);
  }

  @Patch(':id/estimate')
  updateEstimate(
    @Param('id') id: string,
    @Body() dto: UpdateTenderEstimateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tendersService.updateEstimate(id, dto, user.id);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.tendersService.softDelete(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.tendersService.restore(id);
  }

  @Delete(':id/permanent')
  @RequirePermission('Tenders')
  permanentDelete(@Param('id') id: string) {
    return this.tendersService.permanentDelete(id);
  }
}
