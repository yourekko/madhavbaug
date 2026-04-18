import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { AuditLog } from '../entities/audit-log.entity';
import { User } from '../entities/user.entity';
import { UsersService } from '../users/users.service';
import { CompleteDoctorProfileDto } from './dto/complete-doctor-profile.dto';
import { DoctorSignupDto } from './dto/doctor-signup.dto';
import { LoginDto } from './dto/login.dto';
import { PatientSignupDto } from './dto/patient-signup.dto';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
      branchName: input.branchName,
      profileLink: input.profileLink,
      whatsappNumber: input.whatsappNumber,
      expertiseTags: input.expertiseTags,
      profileCompleted: true,
    });
    await this.usersService.updateDoctorWhatsappPhone(user.id, input.whatsappNumber);
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

  async loginWithGoogle(idToken: string, role: 'patient' | 'doctor') {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) throw new BadRequestException('Google sign-in is not configured on the server.');

    const client = new OAuth2Client(clientId);
    let ticket;
    try {
      ticket = await client.verifyIdToken({ idToken, audience: clientId });
    } catch {
      throw new UnauthorizedException('Invalid or expired Google sign-in.');
    }
    const payload = ticket.getPayload();
    if (!payload?.sub) throw new UnauthorizedException('Invalid Google sign-in.');
    if (!payload.email_verified) {
      throw new BadRequestException('Verify your Google email address before using Google sign-in.');
    }
    const sub = payload.sub;
    const email = (payload.email ?? '').toLowerCase().trim() || null;
    if (!email) throw new BadRequestException('Your Google account must have an email address.');
    const name = (payload.name ?? '').trim() || email.split('@')[0]!;
    const targetRole = role === 'doctor' ? Role.DOCTOR : Role.PATIENT;

    let user = await this.usersService.findByGoogleSub(sub);
    if (user) {
      if (user.role !== targetRole) {
        throw new BadRequestException('This Google account is already linked to a different account type.');
      }
      await this.recordAuthAudit(user.id, 'auth.login', { role: user.role, method: 'google' });
      return this.buildAuthResponse(user);
    }

    const existingByEmail = await this.usersService.findByEmailOrPhone(email, null);
    if (existingByEmail) {
      if (existingByEmail.role !== targetRole) {
        throw new BadRequestException('An account with this email already exists with a different role.');
      }
      if (existingByEmail.googleSub && existingByEmail.googleSub !== sub) {
        throw new BadRequestException('This email is linked to a different Google account.');
      }
      user = await this.usersService.setGoogleSub(existingByEmail.id, sub);
      await this.recordAuthAudit(user.id, 'auth.login', { role: user.role, method: 'google' });
      return this.buildAuthResponse(user);
    }

    const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
    if (targetRole === Role.PATIENT) {
      user = await this.usersService.createUser({
        name,
        email,
        phone: null,
        role: Role.PATIENT,
        passwordHash,
        googleSub: sub,
      });
    } else {
      user = await this.usersService.createUser({
        name,
        email,
        phone: null,
        role: Role.DOCTOR,
        passwordHash,
        googleSub: sub,
      });
      await this.usersService.createDoctorProfile({
        userId: user.id,
        degree: '—',
        qualification: '—',
        clinicalExperienceYears: 0,
        photoUrl: null,
        bio: 'Please complete your professional profile to use the doctor panel.',
        branchName: null,
        profileLink: null,
        whatsappNumber: null,
        expertiseTags: [],
        profileCompleted: false,
      });
    }
    await this.recordAuthAudit(user.id, 'auth.signup', { role: user.role, method: 'google' });
    return this.buildAuthResponse(user);
  }

  async completePatientPhone(userId: string, phone: string, name?: string) {
    const user = await this.usersService.getById(userId);
    if (user.role !== Role.PATIENT) throw new ForbiddenException('Only patient accounts can use this step.');
    const updated = await this.usersService.updatePatientPhone(userId, phone, name);
    return this.buildAuthResponse(updated);
  }

  async completeDoctorProfile(userId: string, dto: CompleteDoctorProfileDto) {
    const user = await this.usersService.getById(userId);
    if (user.role !== Role.DOCTOR) throw new ForbiddenException('Only doctor accounts can complete this profile.');
    await this.usersService.completeDoctorProfile(userId, {
      degree: dto.degree,
      qualification: dto.qualification,
      clinicalExperienceYears: dto.clinicalExperienceYears,
      photoUrl: dto.photoUrl ?? null,
      bio: dto.bio,
      branchName: dto.branchName,
      profileLink: dto.profileLink,
      whatsappNumber: dto.whatsappNumber,
      expertiseTags: dto.expertiseTags,
    });
    const refreshed = await this.usersService.updateDoctorWhatsappPhone(userId, dto.whatsappNumber);
    return this.buildAuthResponse(refreshed);
  }

  private async recordAuthAudit(
    userId: string,
    action: 'auth.login' | 'auth.signup',
    payload: { role: string; method?: string },
  ) {
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
    const profile = user.role === Role.DOCTOR ? await this.usersService.getDoctorProfileByUserId(user.id) : null;
    const needsPatientPhone = user.role === Role.PATIENT && !user.phone;
    const needsDoctorProfile = user.role === Role.DOCTOR && ((!!profile && profile.profileCompleted === false) || !user.phone);

    const jwtPayload: JwtPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
      ...(needsPatientPhone ? { needsPatientPhone: true } : {}),
      ...(needsDoctorProfile ? { needsDoctorProfile: true } : {}),
    };
    const accessToken = await this.jwtService.signAsync(jwtPayload);
    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        needsPatientPhone,
        needsDoctorProfile,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.usersService.getById(userId);
    const profile = user.role === Role.DOCTOR ? await this.usersService.getDoctorProfileByUserId(user.id) : null;
    const needsPatientPhone = user.role === Role.PATIENT && !user.phone;
    const needsDoctorProfile = user.role === Role.DOCTOR && ((!!profile && profile.profileCompleted === false) || !user.phone);
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone,
      needsPatientPhone,
      needsDoctorProfile,
      doctorProfile: profile
        ? {
            degree: profile.degree,
            qualification: profile.qualification,
            clinicalExperienceYears: profile.clinicalExperienceYears,
            bio: profile.bio,
            photoUrl: profile.photoUrl,
            branchName: profile.branchName,
            profileLink: profile.profileLink,
            whatsappNumber: profile.whatsappNumber,
            expertiseTags: profile.expertiseTags ?? [],
            profileCompleted: profile.profileCompleted,
          }
        : null,
    };
  }
}
