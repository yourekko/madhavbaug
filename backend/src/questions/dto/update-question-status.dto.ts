import { IsEnum } from 'class-validator';
import { QuestionStatus } from '../../common/enums/question-status.enum';

export class UpdateQuestionStatusDto {
  @IsEnum(QuestionStatus)
  status!: QuestionStatus;
}
