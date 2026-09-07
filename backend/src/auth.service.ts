import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

@Injectable()
export class AuthService {
  private readonly authBaseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly tokenUrl = 'https://oauth2.googleapis.com/token';
  private readonly stateStore = new Map<string, number>(); // state → expiry epoch ms

  buildGoogleAuthorizationUrl() {
    const clientId = this.getRequiredEnv('GOOGLE_CLIENT_ID');
    const redirectUri = this.getRequiredEnv('GOOGLE_REDIRECT_URI');

    // Only the forms.body scope is requested: it's the only one the backend
    // reads or uses. openid/email/profile and an offline (refresh-token)
    // grant were previously requested but never consumed — dropped per the
    // GDPR data-minimisation principle (Art. 5(1)(c)).
    const scopes = ['https://www.googleapis.com/auth/forms.body'];

    this.pruneExpiredStates();
    const state = randomUUID();
    this.stateStore.set(state, Date.now() + 5 * 60_000);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      include_granted_scopes: 'true',
      state,
    });

    return `${this.authBaseUrl}?${params.toString()}`;
  }

  async handleOAuthCallback(code: string, state?: string): Promise<string> {
    if (!state || !this.stateStore.has(state) || Date.now() > this.stateStore.get(state)!) {
      this.stateStore.delete(state ?? '');
      throw new BadRequestException('Invalid or expired OAuth state');
    }
    this.stateStore.delete(state);
    const tokenPayload = new URLSearchParams({
      code,
      client_id: this.getRequiredEnv('GOOGLE_CLIENT_ID'),
      client_secret: this.getRequiredEnv('GOOGLE_CLIENT_SECRET'),
      redirect_uri: this.getRequiredEnv('GOOGLE_REDIRECT_URI'),
      grant_type: 'authorization_code',
    });

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenPayload,
    });

    const tokenData = (await response.json()) as GoogleTokenResponse;

    if (!response.ok || tokenData.error) {
      throw new InternalServerErrorException({
        message: 'Google token exchange failed',
        providerError: tokenData.error,
        providerErrorDescription: tokenData.error_description,
      });
    }

    if (!tokenData.access_token) {
      throw new InternalServerErrorException(
        'Google token exchange did not return access_token',
      );
    }

    return tokenData.access_token;
  }

  private pruneExpiredStates(): void {
    const now = Date.now();
    for (const [key, expiry] of this.stateStore) {
      if (now > expiry) this.stateStore.delete(key);
    }
  }

  private getRequiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
      throw new InternalServerErrorException(
        `Missing required environment variable: ${name}`,
      );
    }

    return value;
  }
}
