import { ArrayMinSize, IsArray, IsEmail, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { QUESTION_CATEGORY_VALUES } from '../../common/constants/question-categories';

export class DoctorSignupDto {
  @IsString()
  name!: string;

  @IsString()
  degree!: string;

  @IsString()
  qualification!: string;

  @IsInt()
  @Min(0)
  clinicalExperienceYears!: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

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

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one area of expertise.' })
  @IsIn([...QUESTION_CATEGORY_VALUES], { each: true })
  expertiseTags!: string[];
}
