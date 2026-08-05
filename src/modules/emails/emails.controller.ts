import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { EmailsService } from './emails.service.js';
import { CreateAppEmailDto } from './dto/app-email.dto.js';
import { UpdateAppEmailDto } from './dto/app-email.dto.js';

@Controller('emails')
@UseGuards(AuthGuard, RolesGuard)
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Get()
  findAll() {
    return this.emailsService.findAll();
  }

  @Post()
  @Roles('admin')
  create(
    @Body() dto: CreateAppEmailDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.emailsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAppEmailDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.emailsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.emailsService.delete(id, user.id);
  }
}
