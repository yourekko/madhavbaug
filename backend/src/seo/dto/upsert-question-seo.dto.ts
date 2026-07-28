import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertQuestionSeoDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  metaDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  robots?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  focusKeyword?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  keywords?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  ogTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  ogDescription?: string;

  /** Internal forum paths e.g. /forum/diabetes-management/... */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  internalLinks?: string[];
}
