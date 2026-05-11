import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { QUESTION_CATEGORY_VALUES } from '../../common/constants/question-categories';

export const CREATABLE_QUESTION_CATEGORIES = QUESTION_CATEGORY_VALUES;

export class CreateQuestionDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  body!: string;

  @Transform(({ value }) => {
    if (value == null || value === '') return undefined;
    const s = String(value).trim();
    if (!s || s === 'Select your condition') return undefined;
    return s;
  })
  @IsOptional()
  @IsString()
  @IsIn([...CREATABLE_QUESTION_CATEGORIES])
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  patientAgeGroup?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  patientGender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  patientHistory?: string;
}
