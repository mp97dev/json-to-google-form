import { mapDslToGoogleRequests } from './mapper.service';
import type { Form } from './dsl-types';

const baseForm: Form = {
  id: 'f1',
  title: 'Test Form',
  description: 'desc',
  mode: 'form',
  settings: { collectEmails: false, limitOneResponse: false, shuffleQuestions: false },
  pages: [
    {
      id: 'p1',
      title: 'Page 1',
      questions: [
        { id: 'q1', type: 'short_answer', title: 'Name?', required: true },
        {
          id: 'q2',
          type: 'multiple_choice',
          title: 'Color?',
          required: false,
          options: ['Red', 'Blue'],
        },
      ],
    },
  ],
};

describe('mapDslToGoogleRequests', () => {
  it('maps a single-page form to ordered items without page break', () => {
    const requests = mapDslToGoogleRequests(baseForm);
    expect(requests).toHaveLength(2);
    expect(requests[0].createItem?.location.index).toBe(0);
    expect(requests[1].createItem?.location.index).toBe(1);
  });

  it('inserts page break between pages', () => {
    const form: Form = {
      ...baseForm,
      pages: [
        ...baseForm.pages,
        {
          id: 'p2',
          title: 'Page 2',
          questions: [{ id: 'q3', type: 'text', title: 'Comments?', required: false }],
        },
      ],
    };
    const requests = mapDslToGoogleRequests(form);
    // p1: 2 questions, page break, p2: 1 question = 4 items
    expect(requests).toHaveLength(4);
    expect(requests[2].createItem?.item.pageBreakItem).toBeDefined();
  });

  it('maps multiple_choice to RADIO', () => {
    const requests = mapDslToGoogleRequests(baseForm);
    const choiceReq = requests[1];
    expect(choiceReq.createItem?.item.questionItem?.question.choiceQuestion?.type).toBe('RADIO');
  });

  it('maps true_false to RADIO with True/False options', () => {
    const form: Form = {
      ...baseForm,
      pages: [
        {
          id: 'p1',
          title: 'Page 1',
          questions: [{ id: 'q1', type: 'true_false', title: 'Is this true?', required: true }],
        },
      ],
    };
    const requests = mapDslToGoogleRequests(form);
    const opts = requests[0].createItem?.item.questionItem?.question.choiceQuestion?.options ?? [];
    expect(opts.map((o) => o.value)).toEqual(['True', 'False']);
  });

  it('adds grading info in quiz mode', () => {
    const form: Form = {
      ...baseForm,
      mode: 'quiz',
      pages: [
        {
          id: 'p1',
          title: 'Page 1',
          questions: [
            {
              id: 'q1',
              type: 'multiple_choice',
              title: 'Capital?',
              required: true,
              options: ['Rome', 'Paris'],
              correctAnswer: 'Rome',
              score: 3,
            },
          ],
        },
      ],
    };
    const requests = mapDslToGoogleRequests(form);
    const grading = requests[0].createItem?.item.questionItem?.question.grading;
    expect(grading?.pointValue).toBe(3);
    expect(grading?.correctAnswers.answers[0].value).toBe('Rome');
  });

  it('maps text question to paragraph:true', () => {
    const form: Form = {
      ...baseForm,
      pages: [
        {
          id: 'p1',
          title: 'Page 1',
          questions: [{ id: 'q1', type: 'text', title: 'Comments?', required: false }],
        },
      ],
    };
    const requests = mapDslToGoogleRequests(form);
    expect(requests[0].createItem?.item.questionItem?.question.textQuestion?.paragraph).toBe(true);
  });

  it('maps short_answer to paragraph:false', () => {
    const requests = mapDslToGoogleRequests(baseForm);
    expect(requests[0].createItem?.item.questionItem?.question.textQuestion?.paragraph).toBe(false);
  });
});
