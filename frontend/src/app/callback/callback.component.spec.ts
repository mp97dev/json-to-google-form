import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { CallbackComponent } from './callback.component';

const store: Record<string, string> = {};
const mockSessionStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};

const mockLocation = { pathname: '/callback', search: '', hash: '' };
const mockHistory = { replaceState: jest.fn() };

beforeAll(() => {
  Object.defineProperty(global, 'sessionStorage', { value: mockSessionStorage, configurable: true });
  Object.defineProperty(global, 'window', {
    value: { location: mockLocation },
    configurable: true,
    writable: true,
  });
  Object.defineProperty(global, 'history', { value: mockHistory, configurable: true });
});

function makeComponent(params: Record<string, string | null>, hash = '') {
  mockLocation.hash = hash;
  const paramMap = { get: (key: string) => params[key] ?? null };
  const subject = new BehaviorSubject(paramMap);
  const mockRoute = { queryParamMap: subject.asObservable() };
  const mockRouter = { navigate: jest.fn().mockResolvedValue(true) };
  const comp = new CallbackComponent(
    mockRoute as unknown as ActivatedRoute,
    mockRouter as unknown as Router,
  );
  return { comp, mockRouter };
}

describe('CallbackComponent', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    mockLocation.hash = '';
    mockHistory.replaceState.mockClear();
  });

  it('saves token to sessionStorage, clears hash, and navigates to / when access_token in fragment', () => {
    const { comp, mockRouter } = makeComponent({}, '#access_token=tok123');
    comp.ngOnInit();
    expect(mockSessionStorage.getItem('access_token')).toBe('tok123');
    expect(mockHistory.replaceState).toHaveBeenCalledWith(null, '', '/callback');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('sets error message with code when error query param present', () => {
    const { comp } = makeComponent({ error: 'exchange_failed' });
    comp.ngOnInit();
    expect(comp.message).toContain('exchange_failed');
  });

  it('sets generic failed message when no token and no error param', () => {
    const { comp } = makeComponent({ error: null });
    comp.ngOnInit();
    expect(comp.message).toContain('failed');
  });
});
