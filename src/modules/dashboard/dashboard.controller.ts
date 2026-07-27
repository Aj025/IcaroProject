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

@Controller('dashboard/layout')
@UseGuards(AuthGuard, ThrottlerGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getLayout(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getLayout(user);
  }

  @Patch()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  saveLayout(
    @Body() dto: SaveLayoutDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dashboardService.saveLayout(dto, user);
  }

  @Post('reset')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  resetLayout(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.resetLayout(user);
  }
}
