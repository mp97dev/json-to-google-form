import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import type { FormSettings } from './dsl-types';
import type { GoogleFormsRequest } from './mapper.service';

@Injectable()
export class GoogleFormsService {
  private readonly logger = new Logger(GoogleFormsService.name);

  private buildOAuth2Client(accessToken: string) {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    client.setCredentials({ access_token: accessToken });
    return client;
  }

  async createForm(
    accessToken: string,
    title: string,
  ): Promise<{ formId: string; formUrl: string }> {
    const auth = this.buildOAuth2Client(accessToken);
    const forms = google.forms({ version: 'v1', auth });

    // Google Forms API v1 only accepts info.title on initial create.
    // All other settings must go through batchUpdate after creation.
    const response = await forms.forms.create({
      requestBody: { info: { title } },
    });

    const formId = response.data.formId;
    if (!formId) {
      throw new Error('Google Forms API did not return a formId');
    }

    const formUrl = `https://docs.google.com/forms/d/${formId}/viewform`;
    this.logger.log(`Created form ${formId}`);
    return { formId, formUrl };
  }

  async batchUpdate(
    accessToken: string,
    formId: string,
    requests: GoogleFormsRequest[],
  ): Promise<void> {
    if (requests.length === 0) return;

    const auth = this.buildOAuth2Client(accessToken);
    const forms = google.forms({ version: 'v1', auth });

    await forms.forms.batchUpdate({
      formId,
      requestBody: { requests },
    });

    this.logger.log(`BatchUpdate on form ${formId}: ${requests.length} items`);
  }

  async patchFormSettings(
    accessToken: string,
    formId: string,
    settings: FormSettings,
    isQuiz: boolean = false,
  ): Promise<void> {
    if (isQuiz) {
      const auth = this.buildOAuth2Client(accessToken);
      const forms = google.forms({ version: 'v1', auth });
      await forms.forms.batchUpdate({
        formId,
        requestBody: {
          requests: [{
            updateSettings: {
              settings: { quizSettings: { isQuiz: true } },
              updateMask: 'quizSettings.isQuiz',
            },
          }],
        },
      });
      this.logger.log(`Form ${formId}: quiz mode enabled`);
    }

    // These settings are not patchable via Forms API v1 REST.
    if (settings.collectEmails) {
      this.logger.warn(`Form ${formId}: collectEmails cannot be set via Forms API v1 REST — skipped.`);
    }
    if (settings.limitOneResponse) {
      this.logger.warn(`Form ${formId}: limitOneResponse cannot be set via Forms API v1 REST — skipped.`);
    }
    if (settings.shuffleQuestions) {
      this.logger.warn(`Form ${formId}: shuffleQuestions is per-page in Forms API v1 and not globally patchable — skipped.`);
    }
  }
}
