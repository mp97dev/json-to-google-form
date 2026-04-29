import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FormsModule } from './forms/forms.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
    FormsModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AuthService],
})
export class AppModule {}
