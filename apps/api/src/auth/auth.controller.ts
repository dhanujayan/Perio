import { Body, Controller, Get, HttpCode, Inject, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AppConfig, SESSION_COOKIE } from '../config';
import { APP_CONFIG } from '../tokens';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';
import { Authenticated, CurrentUser, type SessionUser } from './decorators';

const STRICT = { default: { limit: 10, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Post('register')
  @Throttle(STRICT)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.register(dto);
    this.setCookie(res, token);
    // The token is also returned for non-browser clients (the future mobile app)
    return { user, token };
  }

  @Post('login')
  @HttpCode(200)
  @Throttle(STRICT)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.login(dto);
    this.setCookie(res, token);
    return { user, token };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE, this.cookieOptions());
  }

  @Get('me')
  @Authenticated()
  me(@CurrentUser() user: SessionUser) {
    return { user };
  }

  private setCookie(res: Response, token: string) {
    res.cookie(SESSION_COOKIE, token, { ...this.cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.config.cookieSecure,
      path: '/',
    };
  }
}
