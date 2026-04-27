import { Controller, Get, Query, Res } from '@nestjs/common';

import { AuthService } from './auth.service';

@Controller('auth/google')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  login(@Res() response: { redirect: (url: string) => void }) {
    const authorizationUrl = this.authService.buildGoogleAuthorizationUrl();
    return response.redirect(authorizationUrl);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('scope') scope: string | undefined,
    @Query('state') state: string | undefined,
  ) {
    if (!code) {
      return {
        ok: false,
        message: 'No OAuth code found in callback request.',
      };
    }

    const result = await this.authService.handleOAuthCallback(code, scope, state);

    return {
      ok: true,
      message: 'Google OAuth callback received by backend.',
      oauth: result,
    };
  }
}
