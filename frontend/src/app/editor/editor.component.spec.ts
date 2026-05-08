import { of, throwError } from 'rxjs';
import { EditorComponent } from './editor.component';
import { FormsService } from '../services/forms.service';

const store: Record<string, string> = {};
const mockSessionStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};

const mockClipboard = { writeText: jest.fn().mockResolvedValue(undefined) };

beforeAll(() => {
  Object.defineProperty(global, 'sessionStorage', { value: mockSessionStorage, configurable: true });
  Object.defineProperty(global.navigator, 'clipboard', { value: mockClipboard, configurable: true });
});

function makeService() {
  return { validate: jest.fn(), createForm: jest.fn() };
}

describe('EditorComponent', () => {
  let comp: EditorComponent;
  let svc: ReturnType<typeof makeService>;

  beforeEach(() => {
    svc = makeService();
    comp = new EditorComponent(svc as unknown as FormsService);
    mockSessionStorage.clear();
  });

  it('isWorking is false when state is idle', () => {
    expect(comp.isWorking).toBe(false);
  });

  it('isWorking is true while validating', () => {
    comp.dslJson = '{}';
    let seenWorking = false;
    svc.validate.mockImplementation(() => {
      seenWorking = comp.isWorking;
      return of({ valid: true, errors: [] });
    });
    comp.validate();
    expect(seenWorking).toBe(true);
  });

  it('validate: sets errors on invalid JSON', () => {
    comp.dslJson = 'not-json';
    comp.validate();
    expect(comp.errors).toEqual(['Invalid JSON syntax']);
    expect(comp.state).toBe('error');
  });

  it('validate: sets validationOk on successful validation', () => {
    comp.dslJson = '{"title":"T"}';
    svc.validate.mockReturnValue(of({ valid: true, errors: [] }));
    comp.validate();
    expect(comp.validationOk).toBe(true);
    expect(comp.state).toBe('idle');
  });

  it('validate: sets errors array on validation failure', () => {
    comp.dslJson = '{}';
    svc.validate.mockReturnValue(of({ valid: false, errors: ['missing title'] }));
    comp.validate();
    expect(comp.errors).toEqual(['missing title']);
  });

  it('create: sets serverError when not authenticated', () => {
    comp.dslJson = '{"title":"T"}';
    mockSessionStorage.removeItem('access_token');
    comp.create();
    expect(comp.serverError).toContain('Not authenticated');
    expect(comp.state).toBe('error');
  });

  it('create: sets formUrl on success', () => {
    comp.dslJson = '{"title":"T"}';
    mockSessionStorage.setItem('access_token', 'tok');
    svc.createForm.mockReturnValue(of({ formId: 'id1', formUrl: 'https://forms.google.com/d/abc/viewform' }));
    comp.create();
    expect(comp.formUrl).toBe('https://forms.google.com/d/abc/viewform');
    expect(comp.state).toBe('success');
  });

  it('create: sets serverError on http failure', () => {
    comp.dslJson = '{"title":"T"}';
    mockSessionStorage.setItem('access_token', 'tok');
    svc.createForm.mockReturnValue(throwError(() => ({ message: 'Server error' })));
    comp.create();
    expect(comp.serverError).toBe('Server error');
    expect(comp.state).toBe('error');
  });

  it('copyPrompt: calls clipboard.writeText with the schema prompt', async () => {
    mockClipboard.writeText.mockClear();
    await comp.copyPrompt();
    expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('"mode":"form"|"quiz"'));
    expect(comp.promptCopied).toBe(true);
  });

  it('copyPrompt: resets promptCopied after 2 s', async () => {
    jest.useFakeTimers();
    await comp.copyPrompt();
    expect(comp.promptCopied).toBe(true);
    jest.advanceTimersByTime(2001);
    expect(comp.promptCopied).toBe(false);
    jest.useRealTimers();
  });

  it('onPaste: triggers validate after 500 ms', () => {
    jest.useFakeTimers();
    comp.dslJson = '{"title":"T"}';
    svc.validate.mockReturnValue(of({ valid: true, errors: [] }));
    comp.onPaste();
    expect(svc.validate).not.toHaveBeenCalled();
    jest.advanceTimersByTime(500);
    expect(svc.validate).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('onPaste: debounces rapid calls — validate fires only once', () => {
    jest.useFakeTimers();
    comp.dslJson = '{}';
    svc.validate.mockReturnValue(of({ valid: false, errors: [] }));
    comp.onPaste();
    comp.onPaste();
    comp.onPaste();
    jest.advanceTimersByTime(600);
    expect(svc.validate).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
