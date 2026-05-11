import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class PatientSignupDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  signupLocation?: string;
}
