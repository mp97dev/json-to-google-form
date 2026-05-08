import { UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { FormsController } from './forms.controller';
import { DslValidatorService } from './dsl-validator.service';
import { GoogleFormsService } from './google-forms.service';
import type { Form } from './dsl-types';

const quizForm: Form = {
  id: 'f1',
  title: 'Quiz',
  description: '',
  mode: 'quiz',
  settings: { collectEmails: false, limitOneResponse: false, shuffleQuestions: false },
  pages: [
    {
      id: 'p1',
      title: 'Page 1',
      questions: [
        { id: 'q1', type: 'multiple_choice', title: 'Q?', required: true, options: ['A', 'B'], correctAnswer: 'A', score: 2 },
      ],
    },
  ],
};

function makeServices(overrides: Partial<GoogleFormsService> = {}) {
  const validator = {
    validateForm: jest.fn().mockReturnValue({ valid: true, errors: [] }),
  } as unknown as DslValidatorService;

  const googleForms = {
    createForm: jest.fn().mockResolvedValue({ formId: 'form-123', formUrl: 'https://example.com' }),
    batchUpdate: jest.fn().mockResolvedValue(undefined),
    patchFormSettings: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as GoogleFormsService;

  return { validator, googleForms };
}

describe('FormsController.create', () => {
  it('throws UnauthorizedException when Authorization header is missing', async () => {
    const { validator, googleForms } = makeServices();
    const controller = new FormsController(validator, googleForms);
    await expect(controller.create(quizForm, '')).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnprocessableEntityException when DSL validation fails', async () => {
    const { googleForms } = makeServices();
    const validator = {
      validateForm: jest.fn().mockReturnValue({ valid: false, errors: ['bad payload'] }),
    } as unknown as DslValidatorService;
    const controller = new FormsController(validator, googleForms);
    await expect(controller.create({}, 'Bearer tok')).rejects.toThrow(UnprocessableEntityException);
  });

  it('returns formId and formUrl on success', async () => {
    const { validator, googleForms } = makeServices();
    const controller = new FormsController(validator, googleForms);
    const result = await controller.create(quizForm, 'Bearer tok');
    expect(result.formId).toBe('form-123');
    expect(result.formUrl).toBe('https://example.com');
  });

  it('quiz mode: patchFormSettings is called BEFORE batchUpdate', async () => {
    const callOrder: string[] = [];
    const { validator } = makeServices();
    const googleForms = {
      createForm: jest.fn().mockResolvedValue({ formId: 'form-123', formUrl: 'https://example.com' }),
      patchFormSettings: jest.fn().mockImplementation(async () => { callOrder.push('patchFormSettings'); }),
      batchUpdate: jest.fn().mockImplementation(async () => { callOrder.push('batchUpdate'); }),
    } as unknown as GoogleFormsService;

    const controller = new FormsController(validator, googleForms);
    await controller.create(quizForm, 'Bearer tok');

    expect(callOrder).toEqual(['patchFormSettings', 'batchUpdate']);
  });

  it('quiz mode: patchFormSettings is called with isQuiz=true', async () => {
    const { validator, googleForms } = makeServices();
    const controller = new FormsController(validator, googleForms);
    await controller.create(quizForm, 'Bearer tok');

    expect(googleForms.patchFormSettings).toHaveBeenCalledWith(
      'tok',
      'form-123',
      quizForm.settings,
      true,
    );
  });

  it('regular form: patchFormSettings is called with isQuiz=false', async () => {
    const regularForm: Form = { ...quizForm, mode: 'form' };
    const { validator, googleForms } = makeServices();
    const controller = new FormsController(validator, googleForms);
    await controller.create(regularForm, 'Bearer tok');

    expect(googleForms.patchFormSettings).toHaveBeenCalledWith(
      'tok',
      'form-123',
      regularForm.settings,
      false,
    );
  });
});
