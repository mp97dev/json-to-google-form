import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
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
    isQuiz: boolean,
  ): Promise<{ formId: string; formUrl: string }> {
    const auth = this.buildOAuth2Client(accessToken);
    const forms = google.forms({ version: 'v1', auth });

    const response = await forms.forms.create({
      requestBody: {
        info: { title },
        ...(isQuiz ? { settings: { quizSettings: { isQuiz: true } } } : {}),
      },
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
}
