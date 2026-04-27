import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

const categories = ['Diabetes', 'Heart Health', 'Blood Pressure', 'Weight Management', 'Lifestyle & Diet', 'Other'];

export class CreateQuestionDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  body!: string;

  @IsString()
  @IsIn(categories)
  category!: string;
}
