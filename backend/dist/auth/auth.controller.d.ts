import type { Request } from 'express';
import { Role } from '../common/enums/role.enum';
import { AuthService } from './auth.service';
import { CompleteDoctorProfileDto } from './dto/complete-doctor-profile.dto';
import { CompletePatientPhoneDto } from './dto/complete-patient-phone.dto';
import { DoctorSignupDto } from './dto/doctor-signup.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginDto } from './dto/login.dto';
import { PatientSignupDto } from './dto/patient-signup.dto';
import type { JwtPayload } from './types/jwt-payload.type';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(dto: PatientSignupDto): Promise<{
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
    signupDoctor(dto: DoctorSignupDto): Promise<{
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
    google(dto: GoogleAuthDto): Promise<{
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
    completePatientPhone(user: JwtPayload, dto: CompletePatientPhoneDto): Promise<{
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
    completeDoctorProfile(user: JwtPayload, dto: CompleteDoctorProfileDto): Promise<{
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
    uploadDoctorPhoto(file: Express.Multer.File, req: Request): {
        url: string;
    };
    login(dto: LoginDto): Promise<{
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
    me(user: JwtPayload): Promise<{
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
