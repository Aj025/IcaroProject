import { Controller, Get, Delete, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { PermissionsGuard } from '../../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../../common/decorators/current-user.decorator.js';
import { DropboxService } from './dropbox.service.js';

@Controller('integrations/dropbox')
@UseGuards(AuthGuard, PermissionsGuard, RolesGuard)
export class DropboxController {
  constructor(private readonly dropboxService: DropboxService) {}

  @Get('auth')
  getAuthUrl(@Query('redirectUri') redirectUri: string) {
    return this.dropboxService.getAuthUrl(redirectUri);
  }

  @Get('callback')
  callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('redirectUri') redirectUri: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dropboxService.handleCallback(
      code,
      state,
      redirectUri,
      user.id,
    );
  }

  @Delete()
  @Roles('admin')
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.dropboxService.disconnect(user.id);
  }

  @Get('status')
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.dropboxService.getStatus(user.id);
  }
}
