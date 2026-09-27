import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import type { Database } from '../db/db.module';
import { InjectDb } from '../db/db.module';
import { users, type Role } from '../db/schema';
import { SESSION_COOKIE } from '../config';
import { AUTH_REQUIRED, AuthedRequest, ROLES, toSessionUser } from './decorators';

/**
 * Global guard. Attaches the user when a valid session cookie or Bearer token is present,
 * then enforces @Authenticated() and @Roles() where a route declares them.
 * Bearer tokens are accepted so the future mobile app can use the same API.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @InjectDb() private readonly db: Database,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const token = this.extractToken(req);

    if (token) {
      try {
        const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
        const [row] = await this.db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
        if (row) req.user = toSessionUser(row);
      } catch {
        // Invalid or expired token: treat as signed out
      }
    }

    const targets = [ctx.getHandler(), ctx.getClass()];
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES, targets);
    const authRequired = this.reflector.getAllAndOverride<boolean | undefined>(AUTH_REQUIRED, targets);

    if ((authRequired || roles?.length) && !req.user) {
      throw new UnauthorizedException('Please sign in');
    }
    if (roles?.length && !roles.includes(req.user!.role)) {
      throw new ForbiddenException('You do not have access to this');
    }
    return true;
  }

  private extractToken(req: AuthedRequest): string | undefined {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) return header.slice(7);
    const cookie = (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE];
    return cookie || undefined;
  }
}
