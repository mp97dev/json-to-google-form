import { Module } from '@nestjs/common';
import { FormsController } from './forms.controller';
import { DslValidatorService } from './dsl-validator.service';
import { GoogleFormsService } from './google-forms.service';

@Module({
  controllers: [FormsController],
  providers: [DslValidatorService, GoogleFormsService],
})
export class FormsModule {}
