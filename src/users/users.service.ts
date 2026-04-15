import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { DoctorProfile } from '../entities/doctor-profile.entity';
import { User } from '../entities/user.entity';

type CreateUserInput = {
  name: string;
  email: string | null;
  phone: string | null;
  role: User['role'];
  passwordHash: string;
};

type CreateDoctorProfileInput = {
  userId: string;
  degree: string;
  qualification: string;
  clinicalExperienceYears: number;
  photoUrl: string | null;
  bio: string;
  expertiseTags: string[];
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(DoctorProfile)
    private readonly profileRepo: Repository<DoctorProfile>,
  ) {}

  findByEmailOrPhone(email: string | null, phone: string | null) {
    if (email && phone) {
      return this.usersRepo.findOne({ where: [{ email }, { phone }] });
    }
    if (email) return this.usersRepo.findOne({ where: { email } });
    if (phone) return this.usersRepo.findOne({ where: { phone } });
    return null;
  }

  createUser(input: CreateUserInput) {
    const user = this.usersRepo.create(input);
    return this.usersRepo.save(user);
  }

  createDoctorProfile(input: CreateDoctorProfileInput) {
    const profile = this.profileRepo.create(input);
    return this.profileRepo.save(profile);
  }

  async getById(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  getDoctorProfileByUserId(userId: string) {
    return this.profileRepo.findOne({ where: { userId } });
  }

  getDoctors() {
    return this.usersRepo.find({
      where: { role: Role.DOCTOR },
      order: { createdAt: 'DESC' },
    });
  }
}
