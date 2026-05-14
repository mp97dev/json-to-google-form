import { AuthController } from '../src/auth.controller';
import { AuthService } from '../src/auth.service';

function makeAuthService(overrides: Partial<AuthService> = {}): AuthService {
  return {
    buildGoogleAuthorizationUrl: () => 'https://accounts.google.com/auth?...',
    handleOAuthCallback: async () => 'test-access-token',
    ...overrides,
  } as unknown as AuthService;
}

function makeResponse() {
  let redirectedTo = '';
  return {
    redirect(url: string) {
      redirectedTo = url;
    },
    get url() {
      return redirectedTo;
    },
  };
}

describe('AuthController', () => {
  describe('login', () => {
    it('redirects to the Google authorization URL', () => {
      const service = makeAuthService();
      const controller = new AuthController(service);
      const res = makeResponse();

      controller.login(res);

      expect(res.url).toBe('https://accounts.google.com/auth?...');
    });
  });

  describe('callback', () => {
    it('redirects to frontend with access_token on success', async () => {
      const service = makeAuthService({ handleOAuthCallback: async () => 'tok-abc' });
      const controller = new AuthController(service);
      const res = makeResponse();
      process.env.FRONTEND_URL = 'http://localhost:4200';

      await controller.callback('auth-code', 'valid-state', res);

      expect(res.url).toBe('http://localhost:4200/callback#access_token=tok-abc');
    });

    it('redirects to error=no_code when code is absent', async () => {
      const controller = new AuthController(makeAuthService());
      const res = makeResponse();
      process.env.FRONTEND_URL = 'http://localhost:4200';

      await controller.callback(undefined, undefined, res);

      expect(res.url).toBe('http://localhost:4200/callback?error=no_code');
    });

    it('redirects to error=exchange_failed when service throws a non-BadRequest error', async () => {
      const service = makeAuthService({
        handleOAuthCallback: async () => {
          throw new Error('token exchange failed');
        },
      });
      const controller = new AuthController(service);
      const res = makeResponse();
      process.env.FRONTEND_URL = 'http://localhost:4200';

      await controller.callback('some-code', 'state', res);

      expect(res.url).toBe('http://localhost:4200/callback?error=exchange_failed');
    });

    it('falls back to http://localhost:4200 when FRONTEND_URL is unset', async () => {
      const service = makeAuthService({ handleOAuthCallback: async () => 'tok-xyz' });
      const controller = new AuthController(service);
      const res = makeResponse();
      delete process.env.FRONTEND_URL;

      await controller.callback('code', 'state', res);

      expect(res.url).toBe('http://localhost:4200/callback#access_token=tok-xyz');
    });
  });
});
