import { Controller, Get, Query, Res } from '@nestjs/common';

import { AuthService } from './auth.service';

type HttpResponse = { redirect(url: string): void };

@Controller('auth/google')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  login(@Res() response: HttpResponse) {
    const authorizationUrl = this.authService.buildGoogleAuthorizationUrl();
    return response.redirect(authorizationUrl);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Res() res: HttpResponse,
  ) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4200';

    if (!code) {
      return res.redirect(`${frontendUrl}/callback?error=no_code`);
    }

    try {
      const token = await this.authService.handleOAuthCallback(code, state);
      return res.redirect(`${frontendUrl}/callback?access_token=${token}`);
    } catch (err: unknown) {
      const isBadRequest =
        err instanceof Error && err.constructor.name === 'BadRequestException';
      const errorCode = isBadRequest ? 'invalid_state' : 'exchange_failed';
      return res.redirect(`${frontendUrl}/callback?error=${errorCode}`);
    }
  }
}
