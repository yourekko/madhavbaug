import { IsIn, IsString, MinLength } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  @MinLength(20)
  idToken!: string;

  @IsIn(['patient', 'doctor'])
  role!: 'patient' | 'doctor';
}
