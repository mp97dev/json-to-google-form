import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [],
  controllers: [AppController, AuthController],
  providers: [AuthService],
})
export class AppModule {}
