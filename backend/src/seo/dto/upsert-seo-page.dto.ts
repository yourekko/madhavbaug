import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertSeoPageDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  pageType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  canonicalUrl?: string;

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
  ogDescription?: string;
}
