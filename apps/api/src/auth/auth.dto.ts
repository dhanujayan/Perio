import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
const lower = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));

export class RegisterDto {
  @trim() @IsString() @MinLength(2) @MaxLength(120)
  name: string;

  @lower() @IsEmail() @MaxLength(200)
  email: string;

  @IsString() @MinLength(8) @MaxLength(200)
  password: string;

  @IsOptional() @IsBoolean()
  isStudent?: boolean;

  /** Dental council registration number, or college name for students */
  @IsOptional() @trim() @IsString() @MaxLength(120)
  registrationNo?: string;

  @IsOptional() @trim() @IsString() @MaxLength(80)
  city?: string;

  @IsOptional() @trim() @IsString() @MaxLength(30)
  phone?: string;
}

export class LoginDto {
  @lower() @IsEmail()
  email: string;

  @IsString() @MinLength(1) @MaxLength(200)
  password: string;
}
