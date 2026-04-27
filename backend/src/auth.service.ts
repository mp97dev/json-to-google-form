import { Injectable, InternalServerErrorException } from '@nestjs/common';

interface OAuthCallbackResult {
  code: string;
  scope?: string;
  state?: string;
  exchangedForTokens: boolean;
  tokenType?: string;
  expiresIn?: number;
  refreshTokenReceived?: boolean;
}

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

  buildGoogleAuthorizationUrl() {
    const clientId = this.getRequiredEnv('GOOGLE_CLIENT_ID');
    const redirectUri = this.getRequiredEnv('GOOGLE_REDIRECT_URI');

    const scopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/forms.body',
    ];

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state: 'poc-login',
    });

    return `${this.authBaseUrl}?${params.toString()}`;
  }

  async handleOAuthCallback(
    code: string,
    scope?: string,
    state?: string,
  ): Promise<OAuthCallbackResult> {
    const shouldExchangeCode =
      process.env.GOOGLE_OAUTH_EXCHANGE_CODE === 'true' &&
      Boolean(process.env.GOOGLE_CLIENT_SECRET);

    if (!shouldExchangeCode) {
      return {
        code,
        scope,
        state,
        exchangedForTokens: false,
      };
    }

    const tokenPayload = new URLSearchParams({
      code,
      client_id: this.getRequiredEnv('GOOGLE_CLIENT_ID'),
      client_secret: this.getRequiredEnv('GOOGLE_CLIENT_SECRET'),
      redirect_uri: this.getRequiredEnv('GOOGLE_REDIRECT_URI'),
      grant_type: 'authorization_code',
    });

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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

    return {
      code,
      scope,
      state,
      exchangedForTokens: true,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      refreshTokenReceived: Boolean(tokenData.refresh_token),
    };
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
