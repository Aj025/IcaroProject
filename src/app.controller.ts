import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  @Get()
  root() {
    return { service: 'Icaro Projects API', version: '1.0' };
  }
}
