import { Controller, Get, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/health')
  @ApiResponse({
    status: 200,
    description: 'OK',
  })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Choppi API',
    };
  }
}
