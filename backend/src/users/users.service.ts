import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
  googleSub?: string | null;
};

type CreateDoctorProfileInput = {
  userId: string;
  degree: string;
  qualification: string;
  clinicalExperienceYears: number;
  photoUrl: string | null;
  bio: string;
  branchName: string | null;
  profileLink: string | null;
  whatsappNumber: string | null;
  expertiseTags: string[];
  profileCompleted?: boolean;
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

  findByGoogleSub(googleSub: string) {
    return this.usersRepo.findOne({ where: { googleSub } });
  }

  async setGoogleSub(userId: string, googleSub: string) {
    await this.usersRepo.update({ id: userId }, { googleSub });
    return this.getById(userId);
  }

  createUser(input: CreateUserInput) {
    const user = this.usersRepo.create(input);
    return this.usersRepo.save(user);
  }

  createDoctorProfile(input: CreateDoctorProfileInput) {
    const profile = this.profileRepo.create({
      ...input,
      profileCompleted: input.profileCompleted ?? true,
    });
    return this.profileRepo.save(profile);
  }

  async updatePatientPhone(userId: string, phone: string, name?: string) {
    const normalized = phone.trim();
    const other = await this.usersRepo.findOne({ where: { phone: normalized } });
    if (other && other.id !== userId) {
      throw new ConflictException('That phone number is already registered.');
    }
    await this.usersRepo.update({ id: userId }, { phone: normalized, ...(name?.trim() ? { name: name.trim() } : {}) });
    return this.getById(userId);
  }

  async completeDoctorProfile(
    userId: string,
    input: {
      degree: string;
      qualification: string;
      clinicalExperienceYears: number;
      photoUrl: string | null;
      bio: string;
      branchName: string;
      profileLink: string;
      whatsappNumber: string;
      expertiseTags: string[];
    },
  ) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Doctor profile not found.');
    profile.degree = input.degree;
    profile.qualification = input.qualification;
    profile.clinicalExperienceYears = input.clinicalExperienceYears;
    profile.photoUrl = input.photoUrl;
    profile.bio = input.bio;
    profile.branchName = input.branchName;
    profile.profileLink = input.profileLink;
    profile.whatsappNumber = input.whatsappNumber;
    profile.expertiseTags = input.expertiseTags;
    profile.profileCompleted = true;
    await this.profileRepo.save(profile);
  }

  async updateDoctorWhatsappPhone(userId: string, whatsappNumber: string) {
    const normalized = whatsappNumber.trim();
    const other = await this.usersRepo.findOne({ where: { phone: normalized } });
    if (other && other.id !== userId) {
      throw new ConflictException('That WhatsApp number is already registered.');
    }
    await this.usersRepo.update({ id: userId }, { phone: normalized });
    return this.getById(userId);
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
