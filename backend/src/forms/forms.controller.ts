import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DslValidatorService } from './dsl-validator.service';
import { GoogleFormsService } from './google-forms.service';
import { mapDslToGoogleRequests } from './mapper.service';
import type { Form } from './dsl-types';

@ApiTags('forms')
@Controller('forms')
export class FormsController {
  constructor(
    private readonly validator: DslValidatorService,
    private readonly googleForms: GoogleFormsService,
  ) {}

  @Post('validate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Validate a DSL form payload' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  validate(@Body() body: unknown): { valid: boolean; errors: string[] } {
    return this.validator.validateForm(body);
  }

  @Post('create')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a Google Form from a DSL payload' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <google_access_token>' })
  @ApiResponse({ status: 201, description: 'Form created successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Authorization header' })
  @ApiResponse({ status: 422, description: 'DSL validation failed' })
  async create(
    @Body() body: unknown,
    @Headers('authorization') authHeader: string,
  ): Promise<{ formUrl: string; formId: string }> {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header with Bearer token is required');
    }
    const accessToken = authHeader.slice(7);

    const validation = this.validator.validateForm(body);
    if (!validation.valid) {
      throw new UnprocessableEntityException({ errors: validation.errors });
    }

    const form = body as Form;
    const { formId, formUrl } = await this.googleForms.createForm(
      accessToken,
      form.title,
      form.mode === 'quiz',
    );

    const requests = mapDslToGoogleRequests(form);
    await this.googleForms.batchUpdate(accessToken, formId, requests);

    return { formId, formUrl };
  }
}
