import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CompletePatientPhoneDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsString()
  @MinLength(10)
  @Matches(/^[0-9+\-\s]{10,20}$/, { message: 'Enter a valid phone number (digits, optional + and spaces).' })
  phone!: string;
}
