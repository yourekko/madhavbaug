import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { AuditLog } from '../entities/audit-log.entity';
import { UsersService } from '../users/users.service';
import { CompleteDoctorProfileDto } from './dto/complete-doctor-profile.dto';
import { DoctorSignupDto } from './dto/doctor-signup.dto';
import { LoginDto } from './dto/login.dto';
import { PatientSignupDto } from './dto/patient-signup.dto';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly auditRepo;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, auditRepo: Repository<AuditLog>);
    signupPatient(input: PatientSignupDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            role: Role;
            email: string | null;
            phone: string | null;
            needsPatientPhone: boolean;
            needsDoctorProfile: boolean;
        };
    }>;
    signupDoctor(input: DoctorSignupDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            role: Role;
            email: string | null;
            phone: string | null;
            needsPatientPhone: boolean;
            needsDoctorProfile: boolean;
        };
    }>;
    login(input: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            role: Role;
            email: string | null;
            phone: string | null;
            needsPatientPhone: boolean;
            needsDoctorProfile: boolean;
        };
    }>;
    loginWithGoogle(idToken: string, role: 'patient' | 'doctor'): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            role: Role;
            email: string | null;
            phone: string | null;
            needsPatientPhone: boolean;
            needsDoctorProfile: boolean;
        };
    }>;
    completePatientPhone(userId: string, phone: string, name?: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            role: Role;
            email: string | null;
            phone: string | null;
            needsPatientPhone: boolean;
            needsDoctorProfile: boolean;
        };
    }>;
    completeDoctorProfile(userId: string, dto: CompleteDoctorProfileDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            role: Role;
            email: string | null;
            phone: string | null;
            needsPatientPhone: boolean;
            needsDoctorProfile: boolean;
        };
    }>;
    private recordAuthAudit;
    private buildAuthResponse;
    getMe(userId: string): Promise<{
        id: string;
        name: string;
        role: Role;
        email: string | null;
        phone: string | null;
        needsPatientPhone: boolean;
        needsDoctorProfile: boolean;
        doctorProfile: {
            degree: string;
            qualification: string;
            clinicalExperienceYears: number;
            bio: string;
            photoUrl: string | null;
            branchName: string | null;
            profileLink: string | null;
            whatsappNumber: string | null;
            expertiseTags: string[];
            profileCompleted: boolean;
        } | null;
    }>;
}
