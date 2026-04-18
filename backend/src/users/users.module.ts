import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorProfile } from '../entities/doctor-profile.entity';
import { User } from '../entities/user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, DoctorProfile])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
