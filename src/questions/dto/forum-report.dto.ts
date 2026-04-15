import { IsString, MaxLength, MinLength } from 'class-validator';

export class ForumReportDto {
  @IsString()
  @MinLength(10, { message: 'Please add a bit more detail (at least 10 characters).' })
  @MaxLength(2000)
  message!: string;
}
