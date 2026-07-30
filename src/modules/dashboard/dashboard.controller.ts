import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { DashboardService } from './dashboard.service.js';
import { SaveLayoutDto } from './dto/save-layout.dto.js';
import { UpdateCatalogConfigDto } from './dto/update-catalog-config.dto.js';

@Controller('dashboard')
@UseGuards(AuthGuard, ThrottlerGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('layout')
  getLayout(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getLayout(user);
  }

  @Patch('layout')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  saveLayout(
    @Body() dto: SaveLayoutDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dashboardService.saveLayout(dto, user);
  }

  @Post('layout/reset')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  resetLayout(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.resetLayout(user);
  }

  @Get('catalog')
  getCatalog(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getCatalog(user);
  }

  @Patch('catalog')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  updateCatalogConfig(
    @Body() dto: UpdateCatalogConfigDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dashboardService.updateCatalogConfig(dto, user);
  }

  @Post('catalog/reset')
  @HttpCode(HttpStatus.OK)
  resetCatalogConfig(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.resetCatalogConfig(user);
  }
}
