import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { AuditLog } from '../entities/audit-log.entity';
import { User } from '../entities/user.entity';
import { normalizePublicUploadPhotoUrl } from '../common/utils/normalize-upload-url';
import { UsersService } from '../users/users.service';
import { DoctorSignupDto } from './dto/doctor-signup.dto';
import { LoginDto } from './dto/login.dto';
import { PatientSignupDto } from './dto/patient-signup.dto';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async signupPatient(input: PatientSignupDto) {
    if (!input.email && !input.phone) {
      throw new BadRequestException('Either email or phone is required.');
    }
    const exists = await this.usersService.findByEmailOrPhone(input.email ?? null, input.phone ?? null);
    if (exists) throw new BadRequestException('User already exists with this email/phone.');

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.usersService.createUser({
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      role: Role.PATIENT,
      passwordHash,
      signupLocation: input.signupLocation?.trim() || null,
    });
    await this.recordAuthAudit(user.id, 'auth.signup', { role: user.role });
    return this.buildAuthResponse(user);
  }

  async signupDoctor(input: DoctorSignupDto) {
    const exists = await this.usersService.findByEmailOrPhone(input.email, null);
    if (exists) throw new BadRequestException('Doctor already exists with this email.');

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.usersService.createUser({
      name: input.name,
      email: input.email,
      phone: null,
      role: Role.DOCTOR,
      passwordHash,
    });
    await this.usersService.createDoctorProfile({
      userId: user.id,
      degree: input.degree,
      qualification: input.qualification,
      clinicalExperienceYears: input.clinicalExperienceYears,
      photoUrl: input.photoUrl ?? null,
      bio: input.bio,
      expertiseTags: input.expertiseTags,
    });
    await this.recordAuthAudit(user.id, 'auth.signup', { role: user.role });
    return this.buildAuthResponse(user);
  }

  async login(input: LoginDto) {
    if (!input.email && !input.phone) {
      throw new BadRequestException('Either email or phone is required.');
    }
    const user = await this.usersService.findByEmailOrPhone(input.email ?? null, input.phone ?? null);
    if (!user) throw new UnauthorizedException('Invalid credentials.');
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials.');
    await this.recordAuthAudit(user.id, 'auth.login', { role: user.role });
    return this.buildAuthResponse(user);
  }

  private async recordAuthAudit(userId: string, action: 'auth.login' | 'auth.signup', payload: { role: string }) {
    await this.auditRepo.save(
      this.auditRepo.create({
        actorUserId: userId,
        action,
        entityType: 'auth',
        entityId: null,
        payloadJson: payload,
      }),
    );
  }

  private async buildAuthResponse(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.usersService.getById(userId);
    const profile = user.role === Role.DOCTOR ? await this.usersService.getDoctorProfileByUserId(user.id) : null;
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone,
      doctorProfile: profile
        ? {
            degree: profile.degree,
            qualification: profile.qualification,
            clinicalExperienceYears: profile.clinicalExperienceYears,
            bio: profile.bio,
            photoUrl: normalizePublicUploadPhotoUrl(profile.photoUrl),
            expertiseTags: profile.expertiseTags ?? [],
          }
        : null,
    };
  }
}
