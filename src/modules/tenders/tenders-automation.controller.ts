import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { N8nSecretGuard } from '../../common/guards/n8n-secret.guard.js';
import { TendersAutomationService } from './tenders-automation.service.js';
import { GmailIntakeDto } from './dto/gmail-intake.dto.js';

@Controller('integrations/tenders')
@UseGuards(N8nSecretGuard)
export class TendersAutomationController {
  constructor(private readonly automationService: TendersAutomationService) {}

  @Post('intake')
  async intake(@Body() dto: GmailIntakeDto) {
    return this.automationService.processGmailIntake(
      dto.sourceEmailId,
      dto.subject,
      dto.body,
      dto.receivedDate,
    );
  }

  @Get('pending-estimates')
  async pendingEstimates() {
    return this.automationService.findPendingEstimates();
  }

  @Patch(':id/mark-reminded')
  async markReminded(@Param('id') id: string) {
    return this.automationService.markReminded(id);
  }
}
