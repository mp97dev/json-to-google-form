import type { Form, Question } from './dsl-types';

export interface GoogleFormsRequest {
  createItem?: {
    item: {
      title: string;
      itemId?: string;
      questionItem?: {
        question: {
          required: boolean;
          choiceQuestion?: {
            type: 'RADIO' | 'CHECKBOX' | 'DROP_DOWN';
            options: { value: string; isCorrect?: boolean }[];
            shuffle: boolean;
          };
          textQuestion?: { paragraph: boolean };
          scaleQuestion?: undefined;
          grading?: {
            pointValue: number;
            correctAnswers: { answers: { value: string }[] };
          };
        };
      };
      pageBreakItem?: Record<string, never>;
    };
    location: { index: number };
  };
}

function buildChoiceType(type: Question['type']): 'RADIO' | 'CHECKBOX' | 'DROP_DOWN' | null {
  switch (type) {
    case 'multiple_choice':
      return 'RADIO';
    case 'true_false':
      return 'RADIO';
    case 'checkbox':
      return 'CHECKBOX';
    case 'dropdown':
      return 'DROP_DOWN';
    default:
      return null;
  }
}

function mapQuestion(
  question: Question,
  index: number,
  isQuizMode: boolean,
): GoogleFormsRequest {
  const choiceType = buildChoiceType(question.type);

  if (choiceType) {
    const options = question.type === 'true_false'
      ? ['True', 'False']
      : (question.options ?? []);

    const mappedOptions = options.map((opt) => ({
      value: opt,
      ...(isQuizMode && question.correctAnswer === opt ? { isCorrect: true } : {}),
    }));

    const grading =
      isQuizMode && question.correctAnswer
        ? {
            pointValue: question.score ?? 1,
            correctAnswers: { answers: [{ value: question.correctAnswer }] },
          }
        : undefined;

    return {
      createItem: {
        item: {
          title: question.title,
          itemId: question.id,
          questionItem: {
            question: {
              required: question.required,
              choiceQuestion: {
                type: choiceType,
                options: mappedOptions,
                shuffle: false,
              },
              ...(grading ? { grading } : {}),
            },
          },
        },
        location: { index },
      },
    };
  }

  // text / short_answer
  return {
    createItem: {
      item: {
        title: question.title,
        itemId: question.id,
        questionItem: {
          question: {
            required: question.required,
            textQuestion: {
              paragraph: question.type === 'text',
            },
          },
        },
      },
      location: { index },
    },
  };
}

export function mapDslToGoogleRequests(form: Form): GoogleFormsRequest[] {
  const isQuizMode = form.mode === 'quiz';
  const requests: GoogleFormsRequest[] = [];
  let itemIndex = 0;

  for (let pageIdx = 0; pageIdx < form.pages.length; pageIdx++) {
    const page = form.pages[pageIdx];

    // Add page break before each page except the first
    if (pageIdx > 0) {
      requests.push({
        createItem: {
          item: {
            title: page.title,
            pageBreakItem: {},
          },
          location: { index: itemIndex },
        },
      });
      itemIndex++;
    }

    for (const question of page.questions) {
      requests.push(mapQuestion(question, itemIndex, isQuizMode));
      itemIndex++;
    }
  }

  return requests;
}
