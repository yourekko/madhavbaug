import { IsOptional, IsString, MaxLength } from 'class-validator';

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
}
