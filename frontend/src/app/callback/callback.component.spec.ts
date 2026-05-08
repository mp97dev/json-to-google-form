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

beforeAll(() => {
  Object.defineProperty(global, 'sessionStorage', { value: mockSessionStorage, configurable: true });
});

function makeComponent(params: Record<string, string | null>) {
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
  beforeEach(() => mockSessionStorage.clear());

  it('saves token to sessionStorage and navigates to / when access_token present', () => {
    const { comp, mockRouter } = makeComponent({ access_token: 'tok123', code: null });
    comp.ngOnInit();
    expect(mockSessionStorage.getItem('access_token')).toBe('tok123');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('sets error message when no token and no code', () => {
    const { comp } = makeComponent({ access_token: null, code: null });
    comp.ngOnInit();
    expect(comp.message).toContain('failed');
  });

  it('sets backend-config message when code is present but no token', () => {
    const { comp } = makeComponent({ access_token: null, code: 'auth-code' });
    comp.ngOnInit();
    expect(comp.message).toContain('backend configuration');
  });
});
