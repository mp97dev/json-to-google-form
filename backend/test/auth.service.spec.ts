import { BadRequestException } from '@nestjs/common';
import { AuthService } from '../src/auth.service';

function makeService() {
  return new AuthService();
}

function extractState(url: string): string {
  return new URL(url).searchParams.get('state') ?? '';
}

describe('AuthService', () => {
  const requiredEnv = {
    GOOGLE_CLIENT_ID: 'client-id',
    GOOGLE_CLIENT_SECRET: 'client-secret',
    GOOGLE_REDIRECT_URI: 'http://localhost:3000/auth/google/callback',
  };

  beforeEach(() => {
    Object.assign(process.env, requiredEnv);
  });

  afterEach(() => {
    for (const key of Object.keys(requiredEnv)) {
      delete process.env[key];
    }
    jest.restoreAllMocks();
  });

  describe('buildGoogleAuthorizationUrl', () => {
    it('generates a unique state on each call', () => {
      const svc = makeService();
      const url1 = svc.buildGoogleAuthorizationUrl();
      const url2 = svc.buildGoogleAuthorizationUrl();
      expect(extractState(url1)).not.toBe(extractState(url2));
    });

    it('includes a UUID-shaped state in the authorization URL', () => {
      const svc = makeService();
      const url = svc.buildGoogleAuthorizationUrl();
      expect(extractState(url)).toMatch(/^[0-9a-f-]{36}$/);
    });
  });

  describe('handleOAuthCallback', () => {
    it('throws BadRequestException when state is missing', async () => {
      const svc = makeService();
      await expect(svc.handleOAuthCallback('code', undefined)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequestException for an unknown state', async () => {
      const svc = makeService();
      await expect(
        svc.handleOAuthCallback('code', 'not-a-real-state'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException for an expired state', async () => {
      const svc = makeService();
      const realNow = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(realNow);
      const url = svc.buildGoogleAuthorizationUrl();
      const state = extractState(url);

      jest.spyOn(Date, 'now').mockReturnValue(realNow + 6 * 60_000);

      await expect(svc.handleOAuthCallback('code', state)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('accepts a valid state and returns the access token', async () => {
      const svc = makeService();
      const url = svc.buildGoogleAuthorizationUrl();
      const state = extractState(url);

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'tok-123' }),
      } as Response);

      const token = await svc.handleOAuthCallback('auth-code', state);
      expect(token).toBe('tok-123');
    });

    it('deletes the state after use to prevent replay', async () => {
      const svc = makeService();
      const url = svc.buildGoogleAuthorizationUrl();
      const state = extractState(url);

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'tok-abc' }),
      } as Response);

      await svc.handleOAuthCallback('code', state);

      await expect(svc.handleOAuthCallback('code', state)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
