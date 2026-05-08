import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@Controller()
export class AppController {
  @SkipThrottle()
  @Get('health')
  health() {
    return {
      service: 'backend',
      status: 'ok',
    };
  }
}
