import { GoogleFormsService } from './google-forms.service';
import type { FormSettings } from './dsl-types';

const defaultSettings: FormSettings = {
  collectEmails: false,
  limitOneResponse: false,
  shuffleQuestions: false,
};

describe('GoogleFormsService.patchFormSettings', () => {
  let service: GoogleFormsService;

  beforeEach(() => {
    service = new GoogleFormsService();
  });

  // Google Forms API v1 REST does not expose collectEmails, limitOneResponse,
  // or shuffleQuestions — patchFormSettings logs warnings and resolves cleanly.
  it('resolves without throwing when all settings are false', async () => {
    await expect(
      service.patchFormSettings('tok', 'form-id', defaultSettings),
    ).resolves.toBeUndefined();
  });

  it('resolves without throwing when all settings are true', async () => {
    await expect(
      service.patchFormSettings('tok', 'form-id', {
        collectEmails: true,
        limitOneResponse: true,
        shuffleQuestions: true,
      }),
    ).resolves.toBeUndefined();
  });
});
