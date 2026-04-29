import { DslValidatorService } from './dsl-validator.service';

describe('DslValidatorService', () => {
  let service: DslValidatorService;

  beforeEach(() => {
    service = new DslValidatorService();
  });

  const validForm = {
    id: 'form-1',
    title: 'Test',
    description: 'desc',
    mode: 'form',
    settings: { collectEmails: true, limitOneResponse: false, shuffleQuestions: false },
    pages: [
      {
        id: 'p1',
        title: 'Page 1',
        questions: [
          { id: 'q1', type: 'short_answer', title: 'Name?', required: true },
        ],
      },
    ],
  };

  it('accepts a valid form', () => {
    const result = service.validateForm(validForm);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing required top-level fields', () => {
    const result = service.validateForm({ title: 'Only title' });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects invalid mode', () => {
    const result = service.validateForm({ ...validForm, mode: 'invalid' });
    expect(result.valid).toBe(false);
  });

  it('rejects multiple_choice question without options', () => {
    const form = {
      ...validForm,
      pages: [
        {
          id: 'p1',
          title: 'Page 1',
          questions: [{ id: 'q1', type: 'multiple_choice', title: 'Pick one?', required: true }],
        },
      ],
    };
    const result = service.validateForm(form);
    expect(result.valid).toBe(false);
  });

  it('accepts quiz mode with correctAnswer and score', () => {
    const form = {
      ...validForm,
      mode: 'quiz',
      pages: [
        {
          id: 'p1',
          title: 'Page 1',
          questions: [
            {
              id: 'q1',
              type: 'multiple_choice',
              title: 'Capital of Italy?',
              required: true,
              options: ['Rome', 'Milan'],
              correctAnswer: 'Rome',
              score: 2,
            },
          ],
        },
      ],
    };
    const result = service.validateForm(form);
    expect(result.valid).toBe(true);
  });

  it('rejects empty pages array', () => {
    const result = service.validateForm({ ...validForm, pages: [] });
    expect(result.valid).toBe(false);
  });
});
