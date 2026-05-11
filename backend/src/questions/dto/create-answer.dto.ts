import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAnswerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(250000)
  answerText!: string;

  /** Optional recommendation lines (one per line) used to render the action plan block. */
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  recommendationPlan?: string;
}
