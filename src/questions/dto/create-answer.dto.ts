import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAnswerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(250000)
  answerText!: string;
}
