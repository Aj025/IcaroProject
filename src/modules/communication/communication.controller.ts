import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { CommunicationService } from './communication.service.js';
import {
  SendEmailDto,
  EmailTemplateKeyParam,
  UpdateEmailTemplateDto,
} from './dto/communication.dto.js';

@Controller('communication')
@UseGuards(AuthGuard, RolesGuard)
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Post('emails/send')
  @HttpCode(HttpStatus.OK)
  sendEmail(@Body() dto: SendEmailDto) {
    return this.communicationService.sendEmail(dto);
  }

  @Get('email-templates')
  listTemplates() {
    return this.communicationService.listTemplates();
  }

  @Get('email-templates/:key')
  getTemplate(@Param() params: EmailTemplateKeyParam) {
    return this.communicationService.getTemplate(params.key);
  }

  @Patch('email-templates/:key')
  @Roles('admin')
  updateTemplate(
    @Param() params: EmailTemplateKeyParam,
    @Body() dto: UpdateEmailTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.communicationService.updateTemplate(params.key, dto, user.id);
  }

  @Post('email-templates/:key/reset')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  resetTemplate(
    @Param() params: EmailTemplateKeyParam,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.communicationService.resetTemplate(params.key, user.id);
  }
}
