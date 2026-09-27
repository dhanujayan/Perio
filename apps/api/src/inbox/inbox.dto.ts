import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import {
  audienceEnum,
  enquiryStatusEnum,
  questionStatusEnum,
  type Audience,
  type EnquiryStatus,
  type QuestionStatus,
} from '../db/schema';

const trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
const lower = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));

export class AskQuestionDto {
  @trim() @IsString() @MinLength(2) @MaxLength(120)
  name: string;

  @lower() @IsEmail() @MaxLength(200)
  email: string;

  @IsIn(audienceEnum.enumValues)
  audience: Audience;

  @trim() @IsString() @MinLength(10) @MaxLength(2000)
  question: string;

  /** Honeypot: hidden in the form, bots fill it in */
  @IsOptional() @IsString() @MaxLength(200)
  website?: string;
}

export class ClinicEnquiryDto {
  @trim() @IsString() @MinLength(2) @MaxLength(160)
  clinicName: string;

  @trim() @IsString() @MinLength(2) @MaxLength(120)
  contactName: string;

  @lower() @IsEmail() @MaxLength(200)
  email: string;

  @trim() @IsString() @MinLength(6) @MaxLength(30)
  phone: string;

  @trim() @IsString() @MinLength(2) @MaxLength(80)
  city: string;

  @IsOptional() @trim() @IsString() @MaxLength(300)
  preferredDates?: string;

  @IsOptional() @trim() @IsString() @MaxLength(1000)
  procedures?: string;

  @IsOptional() @trim() @IsString() @MaxLength(3000)
  message?: string;

  @IsOptional() @IsString() @MaxLength(200)
  website?: string;
}

export class QuestionFilter {
  @IsOptional() @IsIn(questionStatusEnum.enumValues)
  status?: QuestionStatus;
}

export class UpdateQuestionDto {
  @IsOptional() @IsIn(questionStatusEnum.enumValues)
  status?: QuestionStatus;

  @IsOptional() @IsString() @MaxLength(2000)
  adminNote?: string;

  @IsOptional() @IsUUID()
  faqId?: string | null;
}

export class DraftFaqFromQuestionDto {
  @IsUUID()
  categoryId: string;
}

export class EnquiryFilter {
  @IsOptional() @IsIn(enquiryStatusEnum.enumValues)
  status?: EnquiryStatus;
}

export class UpdateEnquiryDto {
  @IsOptional() @IsIn(enquiryStatusEnum.enumValues)
  status?: EnquiryStatus;

  @IsOptional() @IsString() @MaxLength(2000)
  adminNote?: string;
}
