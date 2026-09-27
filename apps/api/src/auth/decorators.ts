import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import type { Role, User } from '../db/schema';

export const AUTH_REQUIRED = 'auth:required';
export const ROLES = 'auth:roles';

/** The signed-in user attached to the request by AuthGuard. Never includes the password hash. */
export type SessionUser = Pick<
  User,
  'id' | 'email' | 'name' | 'role' | 'phone' | 'city' | 'registrationNo' | 'isStudent' | 'createdAt'
>;

export interface AuthedRequest extends Request {
  user?: SessionUser;
}

/** Route requires a signed-in user of any role. */
export const Authenticated = () => SetMetadata(AUTH_REQUIRED, true);

/** Route requires a signed-in user with one of these roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

/** Injects the signed-in user, or undefined on public routes. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser | undefined =>
    ctx.switchToHttp().getRequest<AuthedRequest>().user,
);

export function toSessionUser(u: User): SessionUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    phone: u.phone,
    city: u.city,
    registrationNo: u.registrationNo,
    isStudent: u.isStudent,
    createdAt: u.createdAt,
  };
}
