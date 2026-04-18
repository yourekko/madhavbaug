import { ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { QUESTION_CATEGORY_VALUES } from '../../common/constants/question-categories';

export class CompleteDoctorProfileDto {
  @IsString()
  @MinLength(1)
  degree!: string;

  @IsString()
  @MinLength(1)
  qualification!: string;

  @IsInt()
  @Min(0)
  clinicalExperienceYears!: number;

  @IsOptional()
  @IsString()
  photoUrl?: string | null;

  @IsString()
  @MaxLength(400)
  bio!: string;

  @IsString()
  @MinLength(8)
  whatsappNumber!: string;

  @IsString()
  @MinLength(2)
  branchName!: string;

  @IsString()
  @MinLength(5)
  profileLink!: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one area of expertise.' })
  @IsIn([...QUESTION_CATEGORY_VALUES], { each: true })
  expertiseTags!: string[];
}
