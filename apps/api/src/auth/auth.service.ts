import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { InjectDb, type Database } from '../db/db.module';
import { users } from '../db/schema';
import { LoginDto, RegisterDto } from './auth.dto';
import { SessionUser, toSessionUser } from './decorators';

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown, so login takes the same time either way
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

@Injectable()
export class AuthService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly jwt: JwtService,
  ) {}

  static hashPassword(password: string) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  async register(dto: RegisterDto): Promise<{ user: SessionUser; token: string }> {
    const [existing] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);
    if (existing) throw new ConflictException('An account with this email already exists');

    const [row] = await this.db
      .insert(users)
      .values({
        name: dto.name,
        email: dto.email,
        passwordHash: await AuthService.hashPassword(dto.password),
        role: 'DENTIST', // public sign-up can never create staff or admins
        isStudent: dto.isStudent ?? false,
        registrationNo: dto.registrationNo || null,
        city: dto.city || null,
        phone: dto.phone || null,
      })
      .returning();
    const user = toSessionUser(row);
    return { user, token: await this.sign(user) };
  }

  async login(dto: LoginDto): Promise<{ user: SessionUser; token: string }> {
    const [row] = await this.db.select().from(users).where(eq(users.email, dto.email)).limit(1);
    const ok = await bcrypt.compare(dto.password, row?.passwordHash ?? DUMMY_HASH);
    if (!row || !ok) throw new UnauthorizedException('Email or password is incorrect');
    const user = toSessionUser(row);
    return { user, token: await this.sign(user) };
  }

  private sign(user: SessionUser) {
    return this.jwt.signAsync({ sub: user.id, role: user.role });
  }
}
