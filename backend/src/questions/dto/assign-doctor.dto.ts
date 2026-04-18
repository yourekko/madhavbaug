import { IsString } from 'class-validator';

export class AssignDoctorDto {
  @IsString()
  doctorUserId!: string;
}
